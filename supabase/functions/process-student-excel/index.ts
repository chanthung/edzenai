import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.20.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
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
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = splitRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || "").trim();
    });
    return row;
  });

  return { headers, rows };
}

function parseSpreadsheet(fileBase64: string, fileName: string): { headers: string[]; rows: Record<string, string>[] } {
  const bytes = base64ToUint8Array(fileBase64);
  const isCSV = fileName.toLowerCase().endsWith(".csv");

  if (isCSV) {
    const text = new TextDecoder("utf-8").decode(bytes);
    return parseCSV(text);
  }

  // Parse XLSX/XLS using SheetJS
  try {
    const buffer = bytes.buffer;
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in workbook");

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

    if (jsonData.length < 1) throw new Error("File has no data rows");

    const headers = Object.keys(jsonData[0]).map((h) => String(h).trim());
    const rows = jsonData.map((row: Record<string, any>) => {
      const obj: Record<string, string> = {};
      headers.forEach((h) => {
        obj[h] = String(row[h] ?? "").trim();
      });
      return obj;
    });

    return { headers, rows };
  } catch (e) {
    console.error("XLSX parse error:", e);
    throw new Error(
      "Failed to parse the spreadsheet. Please ensure it's a valid .xlsx or .csv file."
    );
  }
}

function normalizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-\.()]/g, "");
  if (cleaned.startsWith("+91") && cleaned.length === 13) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith("91") && cleaned.length === 12) cleaned = cleaned.slice(2);
  return cleaned;
}

function capitalizeName(name: string): string {
  if (!name) return "";
  return name.toLowerCase().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fileBase64, fileName } = await req.json();

    if (!fileBase64 || !fileName) {
      return new Response(
        JSON.stringify({ error: "fileBase64 and fileName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing spreadsheet:", fileName);
    const { headers, rows } = parseSpreadsheet(fileBase64, fileName);
    console.log(`Parsed ${rows.length} rows with headers:`, headers);

    if (rows.length > 500) {
      return new Response(
        JSON.stringify({ error: "File contains too many rows (max 500). Please split into smaller files." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to map columns
    const sampleRows = rows.slice(0, 5);
    const mappingPrompt = `You are a data mapping assistant for a school student management system.

Given these spreadsheet column headers: ${JSON.stringify(headers)}

And these sample rows:
${JSON.stringify(sampleRows, null, 2)}

Map each source column to the correct target field. Target fields are:
- name (student's full name) — REQUIRED
- roll_number (roll number, admission number, or student ID)
- class_name (class/grade, e.g. "Class 5", "5th", "V")
- section (section like A, B, C)
- parent_name (father's name, mother's name, or parent name)
- parent_phone (phone/mobile number) — REQUIRED
- parent_email (email address)
- guardian (guardian name if different from parent)
- address (home address)

Return the mapping as a JSON object where keys are source column names and values are target field names. If a column doesn't map to any target field, map it to null.`;

    console.log("Calling AI for column mapping...");
    const mappingResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: mappingPrompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "column_mapping",
              description: "Map source spreadsheet columns to target student fields",
              parameters: {
                type: "object",
                properties: {
                  mapping: {
                    type: "object",
                    description: "Object where keys are source column names and values are target field names or null",
                    additionalProperties: { type: ["string", "null"] },
                  },
                },
                required: ["mapping"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "column_mapping" } },
      }),
    });

    if (!mappingResponse.ok) {
      const errText = await mappingResponse.text();
      console.error("AI mapping error:", mappingResponse.status, errText);
      if (mappingResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (mappingResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI column mapping failed");
    }

    const mappingResult = await mappingResponse.json();
    const toolCall = mappingResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(mappingResult));
      throw new Error("AI did not return column mapping");
    }

    const { mapping } = JSON.parse(toolCall.function.arguments);
    console.log("Column mapping:", mapping);

    // Apply mapping and clean data
    const warnings: string[] = [];
    const students = rows.map((row, index) => {
      const student: Record<string, string> = {
        name: "", roll_number: "", class_name: "", section: "",
        parent_name: "", parent_phone: "", parent_email: "",
        guardian: "", address: "",
      };

      for (const [sourceCol, targetField] of Object.entries(mapping)) {
        if (targetField && typeof targetField === "string" && targetField in student) {
          student[targetField] = row[sourceCol] || "";
        }
      }

      student.name = capitalizeName(student.name);
      student.parent_name = capitalizeName(student.parent_name);
      student.guardian = capitalizeName(student.guardian);
      student.parent_phone = normalizePhone(student.parent_phone);
      student.parent_email = student.parent_email.toLowerCase().trim();

      if (student.class_name && /^\d+$/.test(student.class_name.trim())) {
        student.class_name = `Class ${student.class_name.trim()}`;
      }

      if (!student.name) warnings.push(`Row ${index + 1}: Missing student name`);
      if (!student.parent_phone) warnings.push(`Row ${index + 1}: Missing phone number`);

      return student;
    });

    console.log(`Processed ${students.length} students, ${warnings.length} warnings`);

    return new Response(
      JSON.stringify({ students, warnings }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-student-excel error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
