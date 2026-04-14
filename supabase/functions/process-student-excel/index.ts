import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── File parsing helpers ──────────────────────────────────────────────

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("File has no data rows");

  function splitRow(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += ch;
    }
    result.push(current.trim());
    return result;
  }

  const headers = splitRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || "").trim(); });
    return row;
  });
  return { headers, rows };
}

function parseSpreadsheet(fileBase64: string, fileName: string) {
  const bytes = base64ToUint8Array(fileBase64);
  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCSV(new TextDecoder("utf-8").decode(bytes));
  }
  try {
    const workbook = XLSX.read(bytes.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in workbook");
    const raw = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1 });
    if (raw.length < 2) throw new Error("File has no data rows");
    const headers = (raw[0] as any[]).map((h: any) => String(h ?? "").trim()).filter(Boolean);
    const rows = (raw as any[][]).slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? "").trim(); });
      return obj;
    });
    return { headers, rows };
  } catch (e) {
    console.error("XLSX parse error:", e);
    throw new Error("Failed to parse the spreadsheet. Please ensure it's a valid .xlsx or .csv file.");
  }
}

// ── Value normalization ───────────────────────────────────────────────

function normalizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) cleaned = cleaned.slice(2);
  if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = cleaned.slice(1);
  return cleaned;
}

function capitalizeName(name: string): string {
  if (!name) return "";
  return name.toLowerCase().split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function normalizeClassName(raw: string): string {
  if (!raw) return "";
  let c = raw.trim();
  // Fix common typos
  c = c.replace(/^Clas\b/i, "Class");
  // "Std 5", "Std. 5", "Standard 5" → "Class 5"
  c = c.replace(/^(Std\.?|Standard)\s*/i, "Class ");
  // "Grade 5" → "Class 5"
  c = c.replace(/^Grade\s*/i, "Class ");
  // Pure number → "Class X"
  if (/^\d+$/.test(c)) c = `Class ${c}`;
  // "Class 05" → "Class 5"
  c = c.replace(/^(Class\s+)0+(\d)/, "$1$2");
  return c;
}

function normalizeGender(raw: string): string {
  if (!raw) return "";
  const g = raw.trim().toLowerCase();
  if (["m", "male", "boy"].includes(g)) return "Male";
  if (["f", "female", "girl"].includes(g)) return "Female";
  if (g) return "Other";
  return "";
}

function normalizeDOB(raw: string): string {
  if (!raw) return "";
  const s = raw.trim();
  // Try YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // MM/DD/YYYY (only if month > 12 swap back)
  // Excel serial number
  if (/^\d{5}$/.test(s)) {
    const d = new Date((parseInt(s) - 25569) * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  return "";
}

function normalizeSection(raw: string): string {
  if (!raw) return "A";
  const s = raw.trim().toUpperCase();
  return s || "A";
}

// ── AI column mapping ─────────────────────────────────────────────────

function extractJSON(text: string): Record<string, string | null> {
  // Strip markdown code fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.mapping || parsed;
  } catch {
    // Try to find JSON object in text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed.mapping || parsed;
    }
    throw new Error("AI returned invalid JSON for column mapping");
  }
}

async function getColumnMapping(headers: string[], sampleRows: Record<string, string>[], apiKey: string): Promise<Record<string, string | null>> {
  const prompt = `You are a data mapper for a school management system.

Map each uploaded Excel column to the correct system field. Return ONLY a JSON object where keys are the exact uploaded column names and values are system field names (or null if no match).

SYSTEM FIELDS:
- name (student full name)
- roll_number (roll no, admission no, student ID, GR No)
- class_name (class, grade, std, standard)
- section (section, division, group)
- parent_name (father name, mother name, guardian name, parent)
- parent_phone (mobile, contact, phone number)
- parent_email (email address)
- guardian (guardian name if different from parent)
- address (home address, residential address)
- gender (sex, male/female)
- date_of_birth (dob, birth date, DOB)
- social_category (caste, category, General/OBC/SC/ST)
- aadhaar_number (aadhaar, uid, aadhar)
- religion

UPLOADED COLUMNS: ${JSON.stringify(headers)}

SAMPLE DATA (first 3 rows):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Return ONLY a flat JSON object. No explanation.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI mapping error:", resp.status, t);
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error("AI column mapping failed");
  }

  const result = await resp.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI did not return column mapping");

  return extractJSON(content);
}

// ── Main handler ──────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return err("AI service not configured");

    const { fileBase64, fileName } = await req.json();
    if (!fileBase64 || !fileName) return err("fileBase64 and fileName are required", 400);

    console.log("Parsing spreadsheet:", fileName);
    const { headers, rows } = parseSpreadsheet(fileBase64, fileName);
    console.log(`Parsed ${rows.length} rows with headers:`, headers);

    if (rows.length === 0) return err("File has no data rows", 400);
    if (rows.length > 500) return err("File contains too many rows (max 500). Please split into smaller files.", 400);

    // AI column mapping
    let mapping: Record<string, string | null>;
    try {
      mapping = await getColumnMapping(headers, rows, LOVABLE_API_KEY);
    } catch (e: any) {
      if (e.message === "RATE_LIMIT") return err("Rate limit exceeded. Please try again in a moment.", 429);
      if (e.message === "CREDITS_EXHAUSTED") return err("AI credits exhausted. Please add credits to continue.", 402);
      throw e;
    }
    console.log("Column mapping:", mapping);

    // Find ignored columns
    const ignoredColumns = Object.entries(mapping)
      .filter(([, v]) => v === null || v === undefined)
      .map(([k]) => k);

    // Apply mapping + normalize
    const warnings: string[] = [];
    const students = rows.map((row, index) => {
      const student: Record<string, string> = {
        name: "", roll_number: "", class_name: "", section: "",
        parent_name: "", parent_phone: "", parent_email: "",
        guardian: "", address: "",
        gender: "", date_of_birth: "", social_category: "",
        aadhaar_number: "", religion: "",
      };

      for (const [sourceCol, targetField] of Object.entries(mapping)) {
        if (targetField && typeof targetField === "string" && targetField in student) {
          const val = row[sourceCol] || "";
          // If field already has a value, concatenate (e.g. multiple name columns)
          if (student[targetField] && val) {
            student[targetField] += " " + val;
          } else if (val) {
            student[targetField] = val;
          }
        }
      }

      // Normalize
      student.name = capitalizeName(student.name);
      student.parent_name = capitalizeName(student.parent_name);
      student.guardian = capitalizeName(student.guardian);
      student.parent_phone = normalizePhone(student.parent_phone);
      student.parent_email = (student.parent_email || "").toLowerCase().trim();
      student.class_name = normalizeClassName(student.class_name);
      student.section = normalizeSection(student.section);
      student.gender = normalizeGender(student.gender);
      student.date_of_birth = normalizeDOB(student.date_of_birth);

      // Trim everything
      for (const key of Object.keys(student)) {
        student[key] = (student[key] || "").trim();
      }

      if (!student.name) warnings.push(`Row ${index + 1}: Missing student name`);
      if (!student.parent_phone) warnings.push(`Row ${index + 1}: Missing phone number`);

      return student;
    });

    console.log(`Processed ${students.length} students, ${warnings.length} warnings, ${ignoredColumns.length} ignored columns`);

    return ok({ students, warnings, ignoredColumns });
  } catch (error) {
    console.error("process-student-excel error:", error);
    return err(error instanceof Error ? error.message : "Unknown error");
  }
});
