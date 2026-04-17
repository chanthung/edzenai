import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.18.5";

type ParsedSheetSummary = {
  sheetName: string;
  className: string;
  section: string | null;
  rowCount: number;
};

type ParsedFeeItem = {
  category_name: string;
  amount: number;
  source_column?: string;
};

type ParsedFeeRow = {
  row_number: number;
  student_name: string;
  roll_number: string;
  class_name: string;
  section: string;
  fees: ParsedFeeItem[];
};

type SpreadsheetParseResult = {
  headers: string[];
  rows: Record<string, string>[];
  rowNumbers: number[];
  sheetSummary?: ParsedSheetSummary[];
  ignoredSheets?: string[];
};

type ParsedFeeStructureInstallment = {
  name: string;
  amount: number;
  due_date: string | null;
};

type ParsedFeeStructureCategory = {
  category_name: string;
  is_mandatory: boolean;
  total_amount: number;
  installments: ParsedFeeStructureInstallment[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STUDENT_HEADER_RULES: Record<string, "student_name" | "roll_number" | "class_name" | "section"> = {
  name: "student_name",
  "student name": "student_name",
  student_name: "student_name",
  student: "student_name",
  "full name": "student_name",
  "student name as per record": "student_name",
  "roll no": "roll_number",
  roll_no: "roll_number",
  rollno: "roll_number",
  "roll number": "roll_number",
  roll_number: "roll_number",
  "admission no": "roll_number",
  "admission number": "roll_number",
  "student id": "roll_number",
  "class": "class_name",
  class_name: "class_name",
  classname: "class_name",
  "class name": "class_name",
  std: "class_name",
  "std.": "class_name",
  standard: "class_name",
  grade: "class_name",
  "grade level": "class_name",
  section: "section",
  sec: "section",
  "sec.": "section",
  division: "section",
};

const LONG_CATEGORY_HEADERS = new Set([
  "category",
  "fee category",
  "fee type",
  "fee name",
  "particular",
  "particulars",
  "head",
  "charge",
  "type",
  "installment",
  "term",
]);

const LONG_AMOUNT_HEADERS = new Set([
  "amount",
  "fee amount",
  "amount due",
  "total amount",
  "value",
  "amt",
]);

const FEE_COLUMN_RE = /\b(fee|amount|term|installment|tuition|transport|admission|bus|hostel|van|library|lab|computer|exam|annual|monthly|quarterly|uniform|activity|activities|sports)\b/i;
const CLASS_SHEET_RE = /^(class|std|standard|grade)\b/i;
const FOUNDATION_SHEET_RE = /^(nursery|lkg|ukg|kg|pre[-\s]?(school|primary|kg)|kindergarten)\b/i;

const STRUCTURE_CATEGORY_HEADERS = new Set([
  "category", "fee category", "fee name", "fee type", "particular", "particulars", "head", "name",
]);
const STRUCTURE_INSTALLMENT_HEADERS = new Set([
  "installment", "installment name", "term", "term name", "month", "period", "schedule",
]);
const STRUCTURE_AMOUNT_HEADERS = new Set([
  "amount", "installment amount", "fee amount", "value", "amt",
]);
const STRUCTURE_TOTAL_HEADERS = new Set([
  "total", "total amount", "total fee", "annual amount", "annual fee", "yearly", "grand total",
]);
const STRUCTURE_DUE_DATE_HEADERS = new Set([
  "due date", "due_date", "duedate", "due", "date", "payment date",
]);
const STRUCTURE_MANDATORY_HEADERS = new Set([
  "mandatory", "is mandatory", "compulsory", "required",
]);
const STUDENT_INDICATOR_HEADERS = new Set([
  "name", "student name", "student", "full name", "roll no", "roll number", "rollno", "admission no", "admission number", "student id",
]);

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeHeader(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string): string {
  return (value || "").trim();
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseCSV(text: string): SpreadsheetParseResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
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
    headers.forEach((header, index) => {
      row[header] = (values[index] || "").trim();
    });
    return row;
  });

  return {
    headers,
    rows,
    rowNumbers: rows.map((_, index) => index + 2),
  };
}

function isClassSheet(name: string): boolean {
  const n = (name || "").trim();
  return CLASS_SHEET_RE.test(n) || FOUNDATION_SHEET_RE.test(n);
}

function extractClassFromSheetName(name: string): string {
  const n = (name || "").trim();
  if (FOUNDATION_SHEET_RE.test(n)) {
    return n.replace(/\s+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
  const match = n.match(/(\d+)/);
  if (match) return `Class ${parseInt(match[1], 10)}`;
  return n;
}

function extractSectionFromSheetName(name: string): string | null {
  const n = (name || "").trim();
  if (FOUNDATION_SHEET_RE.test(n)) return null;
  const match = n.match(/\d+\s*[-_ ]?\s*([A-Za-z])\s*$/);
  return match ? match[1].toUpperCase() : null;
}

function parseSheetRows(sheet: XLSX.WorkSheet): { headers: string[]; rows: Record<string, string>[] } {
  const raw = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
  if (raw.length < 2) return { headers: [], rows: [] };

  const headers = (raw[0] as any[]).map((header) => String(header ?? "").trim()).filter(Boolean);
  const rows = (raw as any[][]).slice(1).map((row) => {
    const result: Record<string, string> = {};
    headers.forEach((header, index) => {
      result[header] = String(row[index] ?? "").trim();
    });
    return result;
  });

  return { headers, rows };
}

function parseSpreadsheet(fileBase64: string, fileName: string): SpreadsheetParseResult {
  const bytes = base64ToUint8Array(fileBase64);

  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCSV(new TextDecoder("utf-8").decode(bytes));
  }

  const workbook = XLSX.read(bytes.buffer, { type: "buffer" });
  const allSheetNames = workbook.SheetNames;
  if (allSheetNames.length === 0) throw new Error("No sheets found in workbook");

  const classSheetNames = allSheetNames.filter(isClassSheet);
  if (classSheetNames.length > 0) {
    const ignoredSheets = allSheetNames.filter((sheetName) => !isClassSheet(sheetName));
    const headersSet = new Set<string>(["class_name", "section"]);
    const rows: Record<string, string>[] = [];
    const rowNumbers: number[] = [];
    const sheetSummary: ParsedSheetSummary[] = [];

    for (const sheetName of classSheetNames) {
      const className = extractClassFromSheetName(sheetName);
      const section = extractSectionFromSheetName(sheetName);
      const parsed = parseSheetRows(workbook.Sheets[sheetName]);
      parsed.headers.forEach((header) => headersSet.add(header));

      const validRows = parsed.rows.filter((row) =>
        Object.values(row).some((value) => value !== null && value !== undefined && String(value).trim() !== "")
      );

      validRows.forEach((row, index) => {
        row.class_name = row.class_name || className;
        if (section && (!row.section || String(row.section).trim() === "")) {
          row.section = section;
        }
        rows.push(row);
        rowNumbers.push(index + 2);
      });

      sheetSummary.push({ sheetName, className, section, rowCount: validRows.length });
    }

    if (rows.length === 0) throw new Error("File has no data rows");

    return {
      headers: Array.from(headersSet),
      rows,
      rowNumbers,
      sheetSummary,
      ignoredSheets,
    };
  }

  const firstSheetName = allSheetNames[0];
  const parsed = parseSheetRows(workbook.Sheets[firstSheetName]);
  if (parsed.rows.length === 0) throw new Error("File has no data rows");

  return {
    headers: parsed.headers,
    rows: parsed.rows,
    rowNumbers: parsed.rows.map((_, index) => index + 2),
  };
}

function parseAmount(raw: string): number | null {
  const value = normalizeText(raw)
    .replace(/[₹$,]/g, "")
    .replace(/\b(rs|inr)\b/gi, "")
    .replace(/\s+/g, "");

  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function detectColumns(headers: string[]) {
  const studentColumns: Partial<Record<"student_name" | "roll_number" | "class_name" | "section", string>> = {};
  const usedHeaders = new Set<string>();
  let categoryColumn: string | null = null;
  let amountColumn: string | null = null;

  headers.forEach((header) => {
    const normalized = normalizeHeader(header);
    const studentField = STUDENT_HEADER_RULES[normalized];
    if (studentField && !studentColumns[studentField]) {
      studentColumns[studentField] = header;
      usedHeaders.add(header);
      return;
    }

    if (!categoryColumn && LONG_CATEGORY_HEADERS.has(normalized)) {
      categoryColumn = header;
      usedHeaders.add(header);
      return;
    }

    if (!amountColumn && LONG_AMOUNT_HEADERS.has(normalized)) {
      amountColumn = header;
      usedHeaders.add(header);
    }
  });

  const wideFeeColumns = headers.filter((header) => {
    if (usedHeaders.has(header)) return false;
    return FEE_COLUMN_RE.test(header);
  });

  if (categoryColumn && amountColumn) {
    return {
      format: "long" as const,
      studentColumns,
      categoryColumn,
      amountColumn,
      feeColumns: [] as string[],
    };
  }

  if (wideFeeColumns.length > 0) {
    return {
      format: "wide" as const,
      studentColumns,
      categoryColumn: null,
      amountColumn: null,
      feeColumns: wideFeeColumns,
    };
  }

  return {
    format: null,
    studentColumns,
    categoryColumn: null,
    amountColumn: null,
    feeColumns: [] as string[],
  };
}

async function getAIDetection(headers: string[], sampleRows: Record<string, string>[], apiKey: string) {
  const prompt = `Decide whether this school fee spreadsheet is wide or long format and map the relevant columns.
Return ONLY a JSON object with this exact shape:
{
  "format": "wide" | "long",
  "student_columns": {
    "student_name": string | null,
    "roll_number": string | null,
    "class_name": string | null,
    "section": string | null
  },
  "fee_columns": string[],
  "category_column": string | null,
  "amount_column": string | null
}

Rules:
- wide = fee categories are separate columns (e.g. Tuition Fee, Transport Fee)
- long = there is a category column and an amount column
- Prefer exact uploaded header names
- Keep unrelated columns out of fee_columns

HEADERS:
${JSON.stringify(headers)}

SAMPLE ROWS:
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

  if (!response.ok) return null;
  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    const match = String(content).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function detectStructureColumns(headers: string[]) {
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));

  const hasStudentIndicator = normalizedHeaders.some((h) => STUDENT_INDICATOR_HEADERS.has(h.norm));
  if (hasStudentIndicator) return null;

  let categoryColumn: string | null = null;
  let installmentColumn: string | null = null;
  let amountColumn: string | null = null;
  let totalColumn: string | null = null;
  let dueDateColumn: string | null = null;
  let mandatoryColumn: string | null = null;

  for (const { raw, norm } of normalizedHeaders) {
    if (!categoryColumn && STRUCTURE_CATEGORY_HEADERS.has(norm)) categoryColumn = raw;
    else if (!installmentColumn && STRUCTURE_INSTALLMENT_HEADERS.has(norm)) installmentColumn = raw;
    else if (!amountColumn && STRUCTURE_AMOUNT_HEADERS.has(norm)) amountColumn = raw;
    else if (!totalColumn && STRUCTURE_TOTAL_HEADERS.has(norm)) totalColumn = raw;
    else if (!dueDateColumn && STRUCTURE_DUE_DATE_HEADERS.has(norm)) dueDateColumn = raw;
    else if (!mandatoryColumn && STRUCTURE_MANDATORY_HEADERS.has(norm)) mandatoryColumn = raw;
  }

  if (!categoryColumn) return null;
  if (!amountColumn && !totalColumn) return null;

  return { categoryColumn, installmentColumn, amountColumn, totalColumn, dueDateColumn, mandatoryColumn };
}

function normalizeDueDate(raw: string): string | null {
  const value = normalizeText(raw);
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const dmy = value.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const ts = Date.parse(value);
  if (!Number.isNaN(ts)) return new Date(ts).toISOString().slice(0, 10);
  return null;
}

function parseMandatory(raw: string): boolean {
  const v = normalizeText(raw).toLowerCase();
  if (!v) return false;
  return ["yes", "y", "true", "1", "mandatory", "compulsory", "required"].includes(v);
}

function buildStructureRows(
  rows: Record<string, string>[],
  cols: NonNullable<ReturnType<typeof detectStructureColumns>>,
) {
  const categoriesMap = new Map<string, ParsedFeeStructureCategory>();
  const warnings: string[] = [];
  let skipped = 0;

  rows.forEach((row) => {
    const categoryRaw = normalizeText(row[cols.categoryColumn!]);
    if (!categoryRaw) { skipped++; return; }

    const amountRaw = cols.amountColumn ? normalizeText(row[cols.amountColumn]) : "";
    const totalRaw = cols.totalColumn ? normalizeText(row[cols.totalColumn]) : "";
    const installmentName = cols.installmentColumn ? normalizeText(row[cols.installmentColumn]) : "";
    const dueRaw = cols.dueDateColumn ? normalizeText(row[cols.dueDateColumn]) : "";
    const mandatoryRaw = cols.mandatoryColumn ? normalizeText(row[cols.mandatoryColumn]) : "";

    const amount = parseAmount(amountRaw);
    const total = parseAmount(totalRaw);

    if (amount === null && total === null) { skipped++; return; }

    const key = categoryRaw.toLowerCase();
    let category = categoriesMap.get(key);
    if (!category) {
      category = {
        category_name: categoryRaw,
        is_mandatory: parseMandatory(mandatoryRaw),
        total_amount: total ?? 0,
        installments: [],
      };
      categoriesMap.set(key, category);
    } else if (total !== null && category.total_amount === 0) {
      category.total_amount = total;
    }
    if (mandatoryRaw && parseMandatory(mandatoryRaw)) category.is_mandatory = true;

    if (amount !== null) {
      const name = installmentName || (category.installments.length === 0 ? "Full Payment" : `Installment ${category.installments.length + 1}`);
      const dueDate = normalizeDueDate(dueRaw);
      const existing = category.installments.find((inst) => inst.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.amount = amount;
        if (!existing.due_date && dueDate) existing.due_date = dueDate;
      } else {
        category.installments.push({ name, amount, due_date: dueDate });
      }
    }
  });

  const structures = Array.from(categoriesMap.values()).map((category) => {
    if (!category.total_amount && category.installments.length > 0) {
      category.total_amount = category.installments.reduce((sum, inst) => sum + inst.amount, 0);
    }
    if (category.installments.length === 0 && category.total_amount > 0) {
      category.installments.push({ name: "Full Payment", amount: category.total_amount, due_date: null });
    }
    return category;
  }).filter((c) => c.total_amount > 0);

  if (skipped > 0) warnings.push(`${skipped} row${skipped === 1 ? " was" : "s were"} skipped (missing category or amount)`);

  return { structures, warnings };
}

function buildWideRows(
  rows: Record<string, string>[],
  rowNumbers: number[],
  studentColumns: Partial<Record<"student_name" | "roll_number" | "class_name" | "section", string>>,
  feeColumns: string[],
) {
  const parsedRows: ParsedFeeRow[] = [];
  const detectedCategories = new Set<string>();
  const warnings: string[] = [];
  let emptyFeeValues = 0;
  let invalidFeeValues = 0;

  rows.forEach((row, index) => {
    const fees: ParsedFeeItem[] = [];

    feeColumns.forEach((column) => {
      const rawValue = normalizeText(row[column]);
      if (!rawValue) {
        emptyFeeValues++;
        return;
      }
      const amount = parseAmount(rawValue);
      if (amount === null) {
        invalidFeeValues++;
        return;
      }
      detectedCategories.add(column.trim());
      fees.push({ category_name: column.trim(), amount, source_column: column });
    });

    parsedRows.push({
      row_number: rowNumbers[index] ?? index + 2,
      student_name: normalizeText(row[studentColumns.student_name || ""]),
      roll_number: normalizeText(row[studentColumns.roll_number || ""]),
      class_name: normalizeText(row[studentColumns.class_name || ""]),
      section: normalizeText(row[studentColumns.section || ""]),
      fees,
    });
  });

  if (emptyFeeValues > 0) warnings.push(`${emptyFeeValues} empty fee value${emptyFeeValues === 1 ? " was" : "s were"} ignored`);
  if (invalidFeeValues > 0) warnings.push(`${invalidFeeValues} non-numeric fee value${invalidFeeValues === 1 ? " was" : "s were"} ignored`);

  return { parsedRows, detectedCategories: Array.from(detectedCategories), warnings };
}

function buildLongRows(
  rows: Record<string, string>[],
  rowNumbers: number[],
  studentColumns: Partial<Record<"student_name" | "roll_number" | "class_name" | "section", string>>,
  categoryColumn: string,
  amountColumn: string,
) {
  const parsedRows: ParsedFeeRow[] = [];
  const detectedCategories = new Set<string>();
  const warnings: string[] = [];
  let emptyFeeValues = 0;
  let invalidFeeValues = 0;
  let missingCategories = 0;

  rows.forEach((row, index) => {
    const rawCategory = normalizeText(row[categoryColumn]);
    const rawAmount = normalizeText(row[amountColumn]);
    const fees: ParsedFeeItem[] = [];

    if (!rawAmount) {
      emptyFeeValues++;
    } else if (!rawCategory) {
      missingCategories++;
    } else {
      const amount = parseAmount(rawAmount);
      if (amount === null) {
        invalidFeeValues++;
      } else {
        detectedCategories.add(rawCategory);
        fees.push({ category_name: rawCategory, amount, source_column: amountColumn });
      }
    }

    parsedRows.push({
      row_number: rowNumbers[index] ?? index + 2,
      student_name: normalizeText(row[studentColumns.student_name || ""]),
      roll_number: normalizeText(row[studentColumns.roll_number || ""]),
      class_name: normalizeText(row[studentColumns.class_name || ""]),
      section: normalizeText(row[studentColumns.section || ""]),
      fees,
    });
  });

  if (emptyFeeValues > 0) warnings.push(`${emptyFeeValues} empty fee value${emptyFeeValues === 1 ? " was" : "s were"} ignored`);
  if (invalidFeeValues > 0) warnings.push(`${invalidFeeValues} non-numeric fee value${invalidFeeValues === 1 ? " was" : "s were"} ignored`);
  if (missingCategories > 0) warnings.push(`${missingCategories} fee row${missingCategories === 1 ? " is" : "s are"} missing a category name`);

  return { parsedRows, detectedCategories: Array.from(detectedCategories), warnings };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const fileBase64 = body?.fileBase64;
    const fileName = body?.fileName;

    if (!fileBase64 || !fileName) {
      return ok({ success: false, error: "fileBase64 and fileName are required", feeRows: [], warnings: [], ignoredColumns: [] });
    }

    const parsed = parseSpreadsheet(fileBase64, fileName);
    const filteredRows = parsed.rows.filter((row) =>
      Object.values(row).some((value) => value !== null && value !== undefined && String(value).trim() !== "")
    );

    if (filteredRows.length === 0) {
      return ok({ success: false, error: "File has no data rows", feeRows: [], warnings: [], ignoredColumns: [] });
    }

    if (filteredRows.length > 2000) {
      return ok({ success: false, error: "File contains too many rows (max 2000). Please split into smaller files.", feeRows: [], warnings: [], ignoredColumns: [] });
    }

    // Try fee_structure mode first (no student columns + has installment/amount/due date)
    const structureCols = detectStructureColumns(parsed.headers);
    if (structureCols) {
      const built = buildStructureRows(filteredRows, structureCols);
      if (built.structures.length === 0) {
        return ok({ success: false, error: "Could not detect any valid fee structures. Please include category and amount columns.", feeRows: [], warnings: built.warnings, ignoredColumns: [] });
      }

      const usedHeaders = new Set<string>([
        structureCols.categoryColumn,
        structureCols.installmentColumn,
        structureCols.amountColumn,
        structureCols.totalColumn,
        structureCols.dueDateColumn,
        structureCols.mandatoryColumn,
      ].filter(Boolean) as string[]);
      const ignoredColumns = parsed.headers.filter((header) => !usedHeaders.has(header));

      return ok({
        success: true,
        format: "fee_structure",
        structures: built.structures,
        warnings: built.warnings,
        ignoredColumns,
        detectedCategories: built.structures.map((s) => s.category_name),
        feeRows: [],
        sheetSummary: parsed.sheetSummary || null,
        ignoredSheets: parsed.ignoredSheets || [],
      });
    }

    let detection = detectColumns(parsed.headers);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!detection.format && apiKey) {
      const aiDetection = await getAIDetection(parsed.headers, filteredRows, apiKey);
      if (aiDetection?.format === "wide" || aiDetection?.format === "long") {
        detection = {
          format: aiDetection.format,
          studentColumns: {
            student_name: aiDetection.student_columns?.student_name || detection.studentColumns.student_name,
            roll_number: aiDetection.student_columns?.roll_number || detection.studentColumns.roll_number,
            class_name: aiDetection.student_columns?.class_name || detection.studentColumns.class_name,
            section: aiDetection.student_columns?.section || detection.studentColumns.section,
          },
          categoryColumn: aiDetection.category_column || null,
          amountColumn: aiDetection.amount_column || null,
          feeColumns: Array.isArray(aiDetection.fee_columns) ? aiDetection.fee_columns.filter((header: string) => parsed.headers.includes(header)) : [],
        };
      }
    }

    if (!detection.format) {
      return ok({ success: false, error: "Could not detect fee columns. Please include columns like Tuition Fee, Term Fee, Category, or Amount.", feeRows: [], warnings: [], ignoredColumns: [] });
    }

    let feeRows: ParsedFeeRow[] = [];
    let detectedCategories: string[] = [];
    let warnings: string[] = [];

    if (detection.format === "wide") {
      const built = buildWideRows(filteredRows, parsed.rowNumbers, detection.studentColumns, detection.feeColumns);
      feeRows = built.parsedRows;
      detectedCategories = built.detectedCategories;
      warnings = built.warnings;
    } else {
      if (!detection.categoryColumn || !detection.amountColumn) {
        return ok({ success: false, error: "Could not detect category and amount columns for fee import.", feeRows: [], warnings: [], ignoredColumns: [] });
      }
      const built = buildLongRows(filteredRows, parsed.rowNumbers, detection.studentColumns, detection.categoryColumn, detection.amountColumn);
      feeRows = built.parsedRows;
      detectedCategories = built.detectedCategories;
      warnings = built.warnings;
    }

    const usedHeaders = new Set<string>([
      detection.studentColumns.student_name,
      detection.studentColumns.roll_number,
      detection.studentColumns.class_name,
      detection.studentColumns.section,
      detection.categoryColumn,
      detection.amountColumn,
      ...detection.feeColumns,
    ].filter(Boolean) as string[]);

    const ignoredColumns = parsed.headers.filter((header) => !usedHeaders.has(header));

    return ok({
      success: true,
      format: detection.format,
      feeRows,
      detectedCategories,
      warnings,
      ignoredColumns,
      sheetSummary: parsed.sheetSummary || null,
      ignoredSheets: parsed.ignoredSheets || [],
    });
  } catch (error) {
    console.error("process-fee-excel error:", error);
    return ok({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during processing",
      feeRows: [],
      warnings: [],
      ignoredColumns: [],
    });
  }
});
