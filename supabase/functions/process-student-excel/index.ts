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

// ── Rule-based column mapping dictionary ──────────────────────────────

const RULE_MAP: Record<string, string> = {
  // name
  "name": "name",
  "student name": "name",
  "student_name": "name",
  "studentname": "name",
  "full name": "name",
  "fullname": "name",
  "pupil name": "name",
  "pupil": "name",
  "student": "name",

  // roll_number
  "roll no": "roll_number",
  "roll_no": "roll_number",
  "rollno": "roll_number",
  "roll number": "roll_number",
  "roll_number": "roll_number",
  "rollnumber": "roll_number",
  "admission no": "roll_number",
  "admission_no": "roll_number",
  "admissionno": "roll_number",
  "admission number": "roll_number",
  "adm no": "roll_number",
  "adm. no": "roll_number",
  "adm. no.": "roll_number",
  "gr no": "roll_number",
  "gr. no": "roll_number",
  "gr. no.": "roll_number",
  "grno": "roll_number",
  "student id": "roll_number",
  "student_id": "roll_number",
  "sr no": "roll_number",
  "sr. no": "roll_number",
  "sr. no.": "roll_number",
  "srno": "roll_number",
  "reg no": "roll_number",
  "reg. no": "roll_number",
  "registration no": "roll_number",
  "registration number": "roll_number",

  // class_name
  "class": "class_name",
  "class_name": "class_name",
  "classname": "class_name",
  "class name": "class_name",
  "std": "class_name",
  "std.": "class_name",
  "standard": "class_name",
  "grade": "class_name",
  "grade level": "class_name",

  // section
  "section": "section",
  "sec": "section",
  "sec.": "section",
  "division": "section",
  "div": "section",
  "div.": "section",
  "group": "section",

  // parent_name
  "parent name": "parent_name",
  "parent_name": "parent_name",
  "parentname": "parent_name",
  "father name": "parent_name",
  "father's name": "parent_name",
  "fathers name": "parent_name",
  "fathername": "parent_name",
  "father": "parent_name",
  "mother name": "parent_name",
  "mother's name": "parent_name",
  "mothers name": "parent_name",
  "mothername": "parent_name",
  "mother": "parent_name",
  "guardian name": "parent_name",
  "guardian's name": "parent_name",
  "guardianname": "parent_name",

  // guardian (kept separate for edge cases)
  "guardian": "guardian",

  // parent_phone
  "phone": "parent_phone",
  "phone no": "parent_phone",
  "phone number": "parent_phone",
  "phone_number": "parent_phone",
  "phonenumber": "parent_phone",
  "mobile": "parent_phone",
  "mobile no": "parent_phone",
  "mobile number": "parent_phone",
  "mobilenumber": "parent_phone",
  "mob": "parent_phone",
  "mob no": "parent_phone",
  "mob.": "parent_phone",
  "contact": "parent_phone",
  "contact no": "parent_phone",
  "contact number": "parent_phone",
  "contactnumber": "parent_phone",
  "parent phone": "parent_phone",
  "parent_phone": "parent_phone",
  "father phone": "parent_phone",
  "mother phone": "parent_phone",
  "guardian phone": "parent_phone",
  "whatsapp": "parent_phone",
  "whatsapp no": "parent_phone",
  "whatsapp number": "parent_phone",

  // parent_email
  "email": "parent_email",
  "email id": "parent_email",
  "email_id": "parent_email",
  "emailid": "parent_email",
  "email address": "parent_email",
  "parent email": "parent_email",
  "parent_email": "parent_email",

  // address
  "address": "address",
  "home address": "address",
  "residential address": "address",
  "addr": "address",

  // gender
  "gender": "gender",
  "sex": "gender",

  // date_of_birth
  "dob": "date_of_birth",
  "d.o.b": "date_of_birth",
  "d.o.b.": "date_of_birth",
  "date of birth": "date_of_birth",
  "date_of_birth": "date_of_birth",
  "dateofbirth": "date_of_birth",
  "birth date": "date_of_birth",
  "birthdate": "date_of_birth",
  "birth_date": "date_of_birth",

  // social_category
  "category": "social_category",
  "social category": "social_category",
  "social_category": "social_category",
  "caste": "social_category",
  "caste category": "social_category",

  // aadhaar_number
  "aadhaar": "aadhaar_number",
  "aadhar": "aadhaar_number",
  "aadhaar no": "aadhaar_number",
  "aadhar no": "aadhaar_number",
  "aadhaar number": "aadhaar_number",
  "aadhar number": "aadhaar_number",
  "aadhaar_number": "aadhaar_number",
  "uid": "aadhaar_number",
  "uid no": "aadhaar_number",

  // religion
  "religion": "religion",
};

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
  c = c.replace(/^Clas\b/i, "Class");
  c = c.replace(/^(Std\.?|Standard)\s*/i, "Class ");
  c = c.replace(/^Grade\s*/i, "Class ");
  if (/^\d+$/.test(c)) c = `Class ${c}`;
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
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
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

// ── Hybrid mapping: rule-based + AI ───────────────────────────────────

function applyRuleMapping(headers: string[]): { ruleMapping: Record<string, string | null>; unmatchedHeaders: string[] } {
  const ruleMapping: Record<string, string | null> = {};
  const unmatchedHeaders: string[] = [];
  const usedTargets = new Set<string>();

  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[^a-z0-9\s.]/g, "").trim();
    const target = RULE_MAP[normalized];
    if (target && !usedTargets.has(target)) {
      ruleMapping[header] = target;
      usedTargets.add(target);
    } else if (target && usedTargets.has(target)) {
      // Already mapped to this target, skip (e.g. second name column)
      unmatchedHeaders.push(header);
    } else {
      unmatchedHeaders.push(header);
    }
  }

  return { ruleMapping, unmatchedHeaders };
}

function extractJSON(text: string): Record<string, string | null> {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.mapping || parsed;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed.mapping || parsed;
    }
    throw new Error("AI returned invalid JSON for column mapping");
  }
}

async function getAIMapping(unmatchedHeaders: string[], sampleRows: Record<string, string>[], apiKey: string, alreadyMapped: string[]): Promise<Record<string, string | null>> {
  if (unmatchedHeaders.length === 0) return {};

  const systemFields = [
    "name", "roll_number", "class_name", "section",
    "parent_name", "parent_phone", "parent_email", "guardian",
    "address", "gender", "date_of_birth", "social_category",
    "aadhaar_number", "religion",
  ].filter((f) => !alreadyMapped.includes(f));

  if (systemFields.length === 0) {
    // All fields already mapped by rules
    const result: Record<string, string | null> = {};
    for (const h of unmatchedHeaders) result[h] = null;
    return result;
  }

  // Build sample data limited to unmatched columns
  const filteredSamples = sampleRows.slice(0, 3).map((row) => {
    const filtered: Record<string, string> = {};
    for (const h of unmatchedHeaders) filtered[h] = row[h] || "";
    return filtered;
  });

  const prompt = `Map each uploaded Excel column to the correct system field. Return ONLY a JSON object where keys are the exact uploaded column names and values are system field names (or null if no match).

REMAINING SYSTEM FIELDS: ${JSON.stringify(systemFields)}

UNMATCHED COLUMNS: ${JSON.stringify(unmatchedHeaders)}

SAMPLE DATA (first 3 rows):
${JSON.stringify(filteredSamples, null, 2)}

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
    // On AI failure, mark all unmatched as null (ignored) — don't crash
    const fallback: Record<string, string | null> = {};
    for (const h of unmatchedHeaders) fallback[h] = null;
    return fallback;
  }

  const result = await resp.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    const fallback: Record<string, string | null> = {};
    for (const h of unmatchedHeaders) fallback[h] = null;
    return fallback;
  }

  try {
    return extractJSON(content);
  } catch {
    const fallback: Record<string, string | null> = {};
    for (const h of unmatchedHeaders) fallback[h] = null;
    return fallback;
  }
}

// ── Main handler ──────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return ok({ success: false, error: "AI service not configured", students: [], warnings: [], ignoredColumns: [] });

    let body: any;
    try {
      body = await req.json();
    } catch {
      return ok({ success: false, error: "Invalid request body", students: [], warnings: [], ignoredColumns: [] });
    }

    const { fileBase64, fileName } = body;
    if (!fileBase64 || !fileName) return ok({ success: false, error: "fileBase64 and fileName are required", students: [], warnings: [], ignoredColumns: [] });

    // Parse spreadsheet safely
    let headers: string[];
    let rows: Record<string, string>[];
    try {
      const parsed = parseSpreadsheet(fileBase64, fileName);
      headers = parsed.headers;
      const parsedRows = parsed.rows;
      headers = parsed.headers;
      // Filter out completely empty rows
      rows = parsedRows.filter(row =>
        Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== "")
      );
    } catch (parseErr: any) {
      return ok({ success: false, error: parseErr.message || "Failed to parse file", students: [], warnings: [], ignoredColumns: [] });
    }

    console.log(`Total parsed rows: ${rows.length} (after filtering empty rows). Headers:`, headers);

    if (rows.length === 0) return ok({ success: false, error: "File has no data rows", students: [], warnings: [], ignoredColumns: [] });
    if (rows.length > 2000) return ok({ success: false, error: "File contains too many rows (max 2000). Please split into smaller files.", students: [], warnings: [], ignoredColumns: [] });

    // STEP 1: Rule-based mapping
    const { ruleMapping, unmatchedHeaders } = applyRuleMapping(headers);
    console.log("Rule-based mapping:", ruleMapping, "Unmatched:", unmatchedHeaders);

    // STEP 2: AI mapping for remaining columns
    const alreadyMappedTargets = Object.values(ruleMapping).filter(Boolean) as string[];
    let aiMapping: Record<string, string | null> = {};
    if (unmatchedHeaders.length > 0) {
      aiMapping = await getAIMapping(unmatchedHeaders, rows, LOVABLE_API_KEY, alreadyMappedTargets);
      console.log("AI mapping:", aiMapping);
    }

    // STEP 3: Merge mappings
    const finalMapping: Record<string, string | null> = { ...ruleMapping, ...aiMapping };
    console.log("Final mapping:", finalMapping);

    // Ignored columns
    const ignoredColumns = Object.entries(finalMapping)
      .filter(([, v]) => v === null || v === undefined)
      .map(([k]) => k);

    // STEP 4: Apply mapping + normalize
    const warnings: string[] = [];
    const students = rows.map((row, index) => {
      const student: Record<string, string> = {
        name: "", roll_number: "", class_name: "", section: "",
        parent_name: "", parent_phone: "", parent_email: "",
        guardian: "", address: "",
        gender: "", date_of_birth: "", social_category: "",
        aadhaar_number: "", religion: "",
      };

      for (const [sourceCol, targetField] of Object.entries(finalMapping)) {
        if (targetField && typeof targetField === "string" && targetField in student) {
          const val = row[sourceCol] || "";
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

      for (const key of Object.keys(student)) {
        student[key] = (student[key] || "").trim();
      }

      if (!student.name) warnings.push(`Row ${index + 1}: Missing student name`);
      if (!student.parent_phone) warnings.push(`Row ${index + 1}: Missing phone number`);

      return student;
    });

    console.log(`Processed ${students.length} students, ${warnings.length} warnings, ${ignoredColumns.length} ignored columns`);

    return ok({ success: true, students, warnings, ignoredColumns });
  } catch (error: any) {
    console.error("process-student-excel error:", error);
    // NEVER crash — always return 200 with error info
    return ok({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during processing",
      students: [],
      warnings: [],
      ignoredColumns: [],
    });
  }
});
