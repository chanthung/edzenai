import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Upload, Loader2, AlertTriangle, CheckCircle2, XCircle, FileSpreadsheet, Plus, Info, Download, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYears, useActiveAcademicYear, useCreateAcademicYear } from "@/hooks/useAcademicYears";
import { useStudents, type Student } from "@/hooks/useStudents";
import { useQueryClient } from "@tanstack/react-query";
import { generateImportReport, type IssueRow } from "@/lib/import-report";

interface ParsedStudent {
  name: string;
  roll_number: string;
  class_name: string;
  section: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  guardian: string;
  address: string;
  gender: string;
  date_of_birth: string;
  social_category: string;
  aadhaar_number: string;
  religion: string;
}

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

type DuplicateType = "strong" | "soft" | null;
type Mode = "students" | "fees";
type FeeFormat = "wide" | "long" | "fee_structure";

type MatchResult = {
  student: Student | null;
  reason?: string;
};

type ParsedStructureInstallment = {
  name: string;
  amount: number;
  due_date: string | null;
};

type ParsedFeeStructure = {
  category_name: string;
  is_mandatory: boolean;
  total_amount: number;
  installments: ParsedStructureInstallment[];
};

interface ProcessedStructure extends ParsedFeeStructure {
  _index: number;
  _selected: boolean;
  _exists: boolean;
}

interface ProcessedRow extends ParsedStudent {
  _rowIndex: number;
  _selected: boolean;
  _issues: string[];
  _isDuplicate: boolean;
  _duplicateType: DuplicateType;
  _duplicateReason?: string;
}

interface ProcessedFeeRow extends ParsedFeeRow {
  _rowIndex: number;
  _selected: boolean;
  _issues: string[];
  _matchedStudentId: string | null;
  _matchedStudentName?: string;
  _matchReason?: string;
}

interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
  ignoredColumns: string[];
  issueRows: IssueRow[];
  createdCategories?: number;
  createdStructures?: number;
  createdInstallments?: number;
  detectedCategories?: string[];
}

type Step = "upload" | "preview" | "importing" | "done";

interface BulkStudentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: Mode;
  onComplete?: (payload: { mode: Mode; imported: number; createdCategories?: number; createdStructures?: number; createdInstallments?: number; format?: FeeFormat }) => void;
}

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function normalizeClassValue(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (/^class\s+/i.test(raw)) return raw.toLowerCase();
  if (/^\d+$/.test(raw)) return `class ${raw}`;
  return raw.toLowerCase();
}

function formatCurrencyValue(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BulkStudentUpload({ open, onOpenChange, mode = "students", onComplete }: BulkStudentUploadProps) {
  const { data: school } = useSchool();
  const { data: academicYears } = useAcademicYears();
  const activeAcademicYear = useActiveAcademicYear();
  const { data: existingStudents } = useStudents();
  const createYear = useCreateAcademicYear();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [academicYearId, setAcademicYearId] = useState("");
  const [defaultDueDate, setDefaultDueDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [feeRows, setFeeRows] = useState<ProcessedFeeRow[]>([]);
  const [feeStructures, setFeeStructures] = useState<ProcessedStructure[]>([]);
  const [feeFormat, setFeeFormat] = useState<FeeFormat | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ignoredColumns, setIgnoredColumns] = useState<string[]>([]);
  const [detectedCategories, setDetectedCategories] = useState<string[]>([]);
  const [sheetSummary, setSheetSummary] = useState<{ sheetName: string; className: string; section?: string | null; rowCount: number }[] | null>(null);
  const [ignoredSheets, setIgnoredSheets] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newYearName, setNewYearName] = useState("");
  const [newYearStart, setNewYearStart] = useState("");
  const [newYearEnd, setNewYearEnd] = useState("");
  const [isCreatingYear, setIsCreatingYear] = useState(false);

  const effectiveYearId = useMemo(() => {
    if (academicYearId) return academicYearId;
    if (activeAcademicYear?.id) return activeAcademicYear.id;
    if (academicYears?.length === 1) return academicYears[0].id;
    return "";
  }, [academicYearId, activeAcademicYear, academicYears]);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setAcademicYearId("");
    setDefaultDueDate("");
    setRows([]);
    setFeeRows([]);
    setFeeStructures([]);
    setFeeFormat(null);
    setWarnings([]);
    setIgnoredColumns([]);
    setDetectedCategories([]);
    setSheetSummary(null);
    setIgnoredSheets([]);
    setImportProgress(0);
    setSummary(null);
    setIsProcessing(false);
    setShowInlineCreate(false);
    setNewYearName("");
    setNewYearStart("");
    setNewYearEnd("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const validateRow = useCallback((row: ParsedStudent): string[] => {
    const issues: string[] = [];
    if (!row.name?.trim()) issues.push("Missing name");
    if (!row.parent_phone?.trim()) issues.push("Missing phone");
    return issues;
  }, []);

  const checkDuplicate = useCallback(
    (row: ParsedStudent): { isDuplicate: boolean; duplicateType: DuplicateType; reason?: string } => {
      if (!existingStudents) return { isDuplicate: false, duplicateType: null };

      const aadhaarMatch = row.aadhaar_number?.trim() && existingStudents.find((student) => student.aadhaar_number && student.aadhaar_number === row.aadhaar_number.trim());
      if (aadhaarMatch) {
        return {
          isDuplicate: true,
          duplicateType: "strong",
          reason: `Aadhaar match: ${aadhaarMatch.name}, ${aadhaarMatch.class_name || "N/A"}`,
        };
      }

      const rollClassMatch = row.roll_number?.trim() && row.class_name?.trim() && existingStudents.find(
        (student) => student.roll_number === row.roll_number.trim() && student.class_name === row.class_name.trim(),
      );
      if (rollClassMatch) {
        return {
          isDuplicate: true,
          duplicateType: "strong",
          reason: `Roll+Class match: ${rollClassMatch.name}, Roll ${rollClassMatch.roll_number}, ${rollClassMatch.class_name}`,
        };
      }

      const nameClassMatch = existingStudents.find(
        (student) => student.name?.toLowerCase().trim() === row.name?.toLowerCase().trim() && student.class_name === row.class_name?.trim(),
      );
      if (nameClassMatch) {
        return {
          isDuplicate: true,
          duplicateType: "strong",
          reason: `Name+Class match: ${nameClassMatch.name}, ${nameClassMatch.class_name}`,
        };
      }

      const phoneMatch = row.parent_phone?.trim() && existingStudents.find((student) => student.parent_phone && student.parent_phone === row.parent_phone.trim());
      if (phoneMatch) {
        return {
          isDuplicate: true,
          duplicateType: "soft",
          reason: `Same phone as: ${phoneMatch.name}, ${phoneMatch.class_name || "N/A"}`,
        };
      }

      const nameSectionMatch = existingStudents.find(
        (student) => student.name?.toLowerCase().trim() === row.name?.toLowerCase().trim() && student.section === row.section?.trim() && student.class_name !== row.class_name?.trim(),
      );
      if (nameSectionMatch) {
        return {
          isDuplicate: true,
          duplicateType: "soft",
          reason: `Same name+section (diff class): ${nameSectionMatch.name}, ${nameSectionMatch.class_name}`,
        };
      }

      return { isDuplicate: false, duplicateType: null };
    },
    [existingStudents],
  );

  const matchStudentForFeeRow = useCallback(
    (row: ParsedFeeRow): MatchResult => {
      if (!existingStudents?.length) return { student: null };

      const normalizedRoll = normalizeText(row.roll_number);
      const normalizedName = normalizeText(row.student_name);
      const normalizedClass = normalizeClassValue(row.class_name);

      if (normalizedRoll && normalizedClass) {
        const exact = existingStudents.find(
          (student) => normalizeText(student.roll_number) === normalizedRoll && normalizeClassValue(student.class_name) === normalizedClass,
        );
        if (exact) return { student: exact, reason: "Matched by roll number + class" };
      }

      if (normalizedName && normalizedClass) {
        const exact = existingStudents.find(
          (student) => normalizeText(student.name) === normalizedName && normalizeClassValue(student.class_name) === normalizedClass,
        );
        if (exact) return { student: exact, reason: "Matched by student name + class" };
      }

      return { student: null };
    },
    [existingStudents],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      toast.error("Please upload a .xlsx or .csv file");
      return;
    }
    setFile(selected);
  };

  const autoCreateAcademicYear = async (): Promise<string> => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    const yearName = `${currentYear}-${String(nextYear).slice(2)}`;
    const startDate = now.toISOString().split("T")[0];
    const endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split("T")[0];
    const result = await createYear.mutateAsync({
      name: yearName,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    });
    await queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    toast.success(`Academic year "${yearName}" created automatically`);
    return result.id;
  };

  const handleInlineCreate = async () => {
    if (!newYearName.trim() || !newYearStart || !newYearEnd) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsCreatingYear(true);
    try {
      const result = await createYear.mutateAsync({
        name: newYearName.trim(),
        start_date: newYearStart,
        end_date: newYearEnd,
        is_active: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      setAcademicYearId(result.id);
      setShowInlineCreate(false);
      setNewYearName("");
      setNewYearStart("");
      setNewYearEnd("");
      toast.success("Academic year created");
    } catch (err: any) {
      toast.error("Failed to create academic year", { description: err.message });
    } finally {
      setIsCreatingYear(false);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const fileBase64 = btoa(binary);

      const functionName = mode === "students" ? "process-student-excel" : "process-fee-excel";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { fileBase64, fileName: file.name },
      });

      if (error) throw new Error(error.message);
      if (data?.success === false) throw new Error(data.error || "Processing failed");

      if (mode === "students") {
        if (!data?.students || !Array.isArray(data.students)) {
          throw new Error("Invalid response from AI processing");
        }

        const processed: ProcessedRow[] = data.students.map((student: ParsedStudent, index: number) => {
          const issues = validateRow(student);
          const { isDuplicate, duplicateType, reason } = checkDuplicate(student);
          const autoDeselect = issues.length > 0 || duplicateType === "strong";
          return {
            ...student,
            _rowIndex: index,
            _selected: !autoDeselect,
            _issues: issues,
            _isDuplicate: isDuplicate,
            _duplicateType: duplicateType,
            _duplicateReason: reason,
          };
        });

        setRows(processed);
      } else {
        if (data?.format === "fee_structure" && Array.isArray(data?.structures)) {
          // Fetch existing categories to flag duplicates
          let existingNames = new Set<string>();
          if (school?.id) {
            const { data: cats } = await supabase
              .from("fee_categories")
              .select("name")
              .eq("school_id", school.id);
            existingNames = new Set((cats || []).map((c: any) => normalizeText(c.name)));
          }

          const processed: ProcessedStructure[] = data.structures.map((s: ParsedFeeStructure, index: number) => {
            const exists = existingNames.has(normalizeText(s.category_name));
            return {
              ...s,
              installments: s.installments || [],
              _index: index,
              _selected: !exists,
              _exists: exists,
            };
          });

          setFeeStructures(processed);
          setFeeFormat("fee_structure");
          setDetectedCategories(data.detectedCategories || processed.map((s) => s.category_name));
        } else {
          if (!data?.feeRows || !Array.isArray(data.feeRows)) {
            throw new Error("Invalid response from AI processing");
          }

          const processed: ProcessedFeeRow[] = data.feeRows.map((row: ParsedFeeRow, index: number) => {
            const issues: string[] = [];
            if (!row.fees?.length) issues.push("No fee amounts detected");
            const match = matchStudentForFeeRow(row);
            if (!match.student) issues.push("Student not found");
            return {
              ...row,
              fees: row.fees || [],
              _rowIndex: index,
              _selected: issues.length === 0,
              _issues: issues,
              _matchedStudentId: match.student?.id ?? null,
              _matchedStudentName: match.student?.name,
              _matchReason: match.reason,
            };
          });

          setFeeRows(processed);
          setFeeFormat((data?.format as FeeFormat) || "wide");
          setDetectedCategories(data.detectedCategories || []);
        }
      }

      setWarnings(data.warnings || []);
      setIgnoredColumns(data.ignoredColumns || []);
      setSheetSummary(data.sheetSummary || null);
      setIgnoredSheets(data.ignoredSheets || []);
      setStep("preview");
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error("Failed to process file", { description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleStudentRow = (index: number) => {
    setRows((prev) => prev.map((row) => (row._rowIndex === index ? { ...row, _selected: !row._selected } : row)));
  };

  const toggleFeeRow = (index: number) => {
    setFeeRows((prev) => prev.map((row) => (row._rowIndex === index ? { ...row, _selected: !row._selected } : row)));
  };

  const editField = (index: number, field: keyof ParsedStudent, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row._rowIndex !== index) return row;
        const updated = { ...row, [field]: value };
        updated._issues = validateRow(updated);
        return updated;
      }),
    );
  };

  const studentStats = useMemo(() => {
    const selected = rows.filter((row) => row._selected);
    const withIssues = rows.filter((row) => row._issues.length > 0);
    const strongDupes = rows.filter((row) => row._duplicateType === "strong");
    const softDupes = rows.filter((row) => row._duplicateType === "soft");
    return {
      total: rows.length,
      selected: selected.length,
      issues: withIssues.length,
      strongDupes: strongDupes.length,
      softDupes: softDupes.length,
    };
  }, [rows]);

  const feeStats = useMemo(() => {
    const selectedRows = feeRows.filter((row) => row._selected && row._issues.length === 0);
    const matchedRows = feeRows.filter((row) => !!row._matchedStudentId);
    const uniqueMatchedStudents = new Set(matchedRows.map((row) => row._matchedStudentId).filter(Boolean));
    return {
      totalRows: feeRows.length,
      matchedRows: matchedRows.length,
      uniqueMatchedStudents: uniqueMatchedStudents.size,
      issueRows: feeRows.filter((row) => row._issues.length > 0).length,
      totalAssignments: feeRows.reduce((sum, row) => sum + row.fees.length, 0),
      selectedAssignments: selectedRows.reduce((sum, row) => sum + row.fees.length, 0),
    };
  }, [feeRows]);

  const handleStudentImport = async () => {
    if (!school?.id) return;

    const toImport = rows.filter((row) => row._selected && row._issues.length === 0);
    if (toImport.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    let resolvedYearId = effectiveYearId;
    if (!resolvedYearId) {
      try {
        resolvedYearId = await autoCreateAcademicYear();
      } catch (err: any) {
        toast.error("Failed to auto-create academic year", { description: err.message });
        setStep("upload");
        return;
      }
    }

    let imported = 0;
    let errors = 0;
    const importErrors: string[] = [];
    const collectedIssueRows: IssueRow[] = [];

    const skippedRows = rows.filter((row) => !row._selected || row._issues.length > 0);
    skippedRows.forEach((row) => {
      const issueType = row._issues.length > 0 ? "Missing Field" : row._isDuplicate ? "Skipped" : "Skipped";
      const issueDetails = row._issues.length > 0 ? `Missing: ${row._issues.join(", ")}` : row._duplicateReason || "Deselected by admin";
      collectedIssueRows.push({
        rowNumber: row._rowIndex + 1,
        studentName: row.name || "Unknown",
        className: row.class_name || "",
        section: row.section || "",
        rollNo: row.roll_number || "",
        parentName: row.parent_name || "",
        phone: row.parent_phone || "",
        issueType,
        issueDetails,
        actionRequired: row._issues.length > 0 ? "Fix data and add manually" : "Review and add manually if needed",
      });
    });

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        const studentData = {
          school_id: school.id,
          name: row.name.trim(),
          roll_number: row.roll_number?.trim() || null,
          class_name: row.class_name?.trim() || null,
          section: row.section?.trim() || "A",
          parent_name: row.parent_name?.trim() || null,
          parent_phone: row.parent_phone?.trim() || null,
          parent_email: row.parent_email?.trim() || null,
          guardian: row.guardian?.trim() || null,
          address: row.address?.trim() || null,
          gender: row.gender?.trim() || null,
          date_of_birth: row.date_of_birth?.trim() || null,
          social_category: row.social_category?.trim() || null,
          aadhaar_number: row.aadhaar_number?.trim() || null,
          religion: row.religion?.trim() || null,
        };

        const { data: insertedStudent, error } = await supabase
          .from("students")
          .insert(studentData)
          .select("id, class_name, section")
          .single();

        if (error) {
          errors++;
          importErrors.push(`Row ${row._rowIndex + 1} (${row.name}): ${error.message}`);
          collectedIssueRows.push({
            rowNumber: row._rowIndex + 1,
            studentName: row.name || "Unknown",
            className: row.class_name || "",
            section: row.section || "",
            rollNo: row.roll_number || "",
            parentName: row.parent_name || "",
            phone: row.parent_phone || "",
            issueType: "Failed to Insert",
            issueDetails: error.message,
            actionRequired: "Check data and add manually",
          });
          continue;
        }

        imported++;

        if (resolvedYearId && insertedStudent) {
          await supabase.from("student_enrollments").insert({
            student_id: insertedStudent.id,
            academic_year_id: resolvedYearId,
            class_name: insertedStudent.class_name,
            section: insertedStudent.section,
          });

          try {
            await supabase.rpc("auto_assign_fees_for_student", {
              _student_id: insertedStudent.id,
              _academic_year_id: resolvedYearId,
            });
          } catch (feeError) {
            console.error("Fee auto-assign error:", insertedStudent.id, feeError);
          }
        }
      } catch (rowErr: any) {
        errors++;
        importErrors.push(`Row ${row._rowIndex + 1} (${row.name}): ${rowErr.message}`);
        collectedIssueRows.push({
          rowNumber: row._rowIndex + 1,
          studentName: row.name || "Unknown",
          className: row.class_name || "",
          section: row.section || "",
          rollNo: row.roll_number || "",
          parentName: row.parent_name || "",
          phone: row.parent_phone || "",
          issueType: "Failed to Insert",
          issueDetails: rowErr.message,
          actionRequired: "Check data and add manually",
        });
      }

      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    const skipped = rows.length - toImport.length;
    setSummary({
      total: rows.length,
      imported,
      skipped,
      errors,
      errorDetails: importErrors,
      ignoredColumns,
      issueRows: collectedIssueRows,
    });
    setStep("done");

    try {
      await supabase.from("import_logs" as any).insert({
        school_id: school.id,
        file_name: file?.name || "unknown",
        total_rows: rows.length,
        imported_count: imported,
        failed_count: errors + skipped,
        ignored_columns: ignoredColumns,
        issue_rows: collectedIssueRows,
      });
      queryClient.invalidateQueries({ queryKey: ["import-logs"] });
    } catch (logErr) {
      console.error("Failed to save import log:", logErr);
    }

    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
    queryClient.invalidateQueries({ queryKey: ["student-fees"] });
    queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    onComplete?.({ mode: "students", imported });
  };

  const handleFeeImport = async () => {
    if (!school?.id) return;
    if (!defaultDueDate) {
      toast.error("Please choose a default due date before importing fees");
      return;
    }

    const validRows = feeRows.filter((row) => row._selected && row._issues.length === 0 && row._matchedStudentId);
    if (validRows.length === 0) {
      toast.error("No valid fee rows to import");
      return;
    }

    const totalAssignments = validRows.reduce((sum, row) => sum + row.fees.length, 0);
    if (totalAssignments === 0) {
      toast.error("No fee amounts detected in selected rows");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    let resolvedYearId = effectiveYearId;
    if (!resolvedYearId) {
      try {
        resolvedYearId = await autoCreateAcademicYear();
      } catch (err: any) {
        toast.error("Failed to auto-create academic year", { description: err.message });
        setStep("upload");
        return;
      }
    }

    let imported = 0;
    let errors = 0;
    let createdCategories = 0;
    let createdStructures = 0;
    let processedAssignments = 0;
    const importErrors: string[] = [];
    const collectedIssueRows: IssueRow[] = [];

    feeRows
      .filter((row) => !row._selected || row._issues.length > 0 || !row._matchedStudentId)
      .forEach((row) => {
        collectedIssueRows.push({
          rowNumber: row.row_number,
          studentName: row.student_name || "Unknown",
          className: row.class_name || "",
          section: row.section || "",
          rollNo: row.roll_number || "",
          parentName: "",
          phone: "",
          issueType: "Skipped Row",
          issueDetails: row._issues.join(", ") || "Deselected by admin",
          actionRequired: row._issues.includes("Student not found") ? "Create or correct the student record, then import again" : "Review and import again if needed",
        });
      });

    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from("fee_categories")
        .select("id, name")
        .eq("school_id", school.id);
      if (categoryError) throw categoryError;

      const { data: structureData, error: structureError } = await supabase
        .from("fee_structures")
        .select("id, fee_category_id, total_amount")
        .eq("school_id", school.id)
        .eq("academic_year_id", resolvedYearId);
      if (structureError) throw structureError;

      const categoryByName = new Map<string, { id: string; name: string }>();
      (categoryData || []).forEach((category) => {
        categoryByName.set(normalizeText(category.name), category);
      });

      const structureByKey = new Map<string, string>();
      (structureData || []).forEach((structure) => {
        structureByKey.set(`${structure.fee_category_id}::${Number(structure.total_amount).toFixed(2)}`, structure.id);
      });

      const uniqueCategories = new Map<string, string>();
      validRows.forEach((row) => {
        row.fees.forEach((fee) => {
          const key = normalizeText(fee.category_name);
          if (!uniqueCategories.has(key)) uniqueCategories.set(key, fee.category_name.trim());
        });
      });

      for (const [normalizedName, displayName] of uniqueCategories.entries()) {
        if (categoryByName.has(normalizedName)) continue;
        const { data: createdCategory, error: createCategoryError } = await supabase
          .from("fee_categories")
          .insert({
            school_id: school.id,
            name: displayName,
            description: "Imported from Excel",
            is_mandatory: false,
          })
          .select("id, name")
          .single();
        if (createCategoryError) throw createCategoryError;
        categoryByName.set(normalizedName, createdCategory);
        createdCategories++;
      }

      const uniqueStructureCombos = new Map<string, { categoryId: string; categoryName: string; amount: number }>();
      validRows.forEach((row) => {
        row.fees.forEach((fee) => {
          const category = categoryByName.get(normalizeText(fee.category_name));
          if (!category) return;
          const structureKey = `${category.id}::${Number(fee.amount).toFixed(2)}`;
          if (!uniqueStructureCombos.has(structureKey)) {
            uniqueStructureCombos.set(structureKey, {
              categoryId: category.id,
              categoryName: category.name,
              amount: fee.amount,
            });
          }
        });
      });

      for (const [structureKey, combo] of uniqueStructureCombos.entries()) {
        if (structureByKey.has(structureKey)) continue;
        const { data: createdStructure, error: createStructureError } = await supabase
          .from("fee_structures")
          .insert({
            school_id: school.id,
            academic_year_id: resolvedYearId,
            fee_category_id: combo.categoryId,
            total_amount: combo.amount,
          })
          .select("id")
          .single();
        if (createStructureError) throw createStructureError;

        const { error: installmentError } = await supabase.from("installments").insert({
          fee_structure_id: createdStructure.id,
          name: "Full Payment",
          amount: combo.amount,
          due_date: defaultDueDate,
          display_order: 1,
        });
        if (installmentError) throw installmentError;

        structureByKey.set(structureKey, createdStructure.id);
        createdStructures++;
      }

      const matchedStudentIds = Array.from(new Set(validRows.map((row) => row._matchedStudentId).filter(Boolean))) as string[];
      const relevantStructureIds = Array.from(new Set(Array.from(structureByKey.values())));

      const existingAssignments = new Set<string>();
      if (matchedStudentIds.length > 0 && relevantStructureIds.length > 0) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("student_fees")
          .select("student_id, fee_structure_id")
          .in("student_id", matchedStudentIds)
          .in("fee_structure_id", relevantStructureIds);
        if (assignmentError) throw assignmentError;
        (assignmentData || []).forEach((assignment) => {
          existingAssignments.add(`${assignment.student_id}:${assignment.fee_structure_id}`);
        });
      }

      for (const row of validRows) {
        for (const fee of row.fees) {
          const category = categoryByName.get(normalizeText(fee.category_name));
          if (!category) continue;
          const structureKey = `${category.id}::${Number(fee.amount).toFixed(2)}`;
          const feeStructureId = structureByKey.get(structureKey);
          const studentId = row._matchedStudentId;
          if (!feeStructureId || !studentId) continue;

          const assignmentKey = `${studentId}:${feeStructureId}`;
          if (existingAssignments.has(assignmentKey)) {
            collectedIssueRows.push({
              rowNumber: row.row_number,
              studentName: row.student_name || row._matchedStudentName || "Unknown",
              className: row.class_name || "",
              section: row.section || "",
              rollNo: row.roll_number || "",
              parentName: "",
              phone: "",
              issueType: "Already Assigned",
              issueDetails: `${category.name} (${formatCurrencyValue(fee.amount)}) is already linked to this student`,
              actionRequired: "Review the student's fee assignments before importing again",
            });
            processedAssignments++;
            setImportProgress(Math.round((processedAssignments / totalAssignments) * 100));
            continue;
          }

          const { error: insertError } = await supabase.from("student_fees").insert({
            student_id: studentId,
            fee_structure_id: feeStructureId,
          });

          if (insertError) {
            errors++;
            importErrors.push(`Row ${row.row_number} (${row.student_name}) - ${category.name}: ${insertError.message}`);
            collectedIssueRows.push({
              rowNumber: row.row_number,
              studentName: row.student_name || row._matchedStudentName || "Unknown",
              className: row.class_name || "",
              section: row.section || "",
              rollNo: row.roll_number || "",
              parentName: "",
              phone: "",
              issueType: "Failed to Assign",
              issueDetails: `${category.name}: ${insertError.message}`,
              actionRequired: "Retry import or assign this fee manually",
            });
          } else {
            imported++;
            existingAssignments.add(assignmentKey);
          }

          processedAssignments++;
          setImportProgress(Math.round((processedAssignments / totalAssignments) * 100));
        }
      }
    } catch (err: any) {
      errors++;
      importErrors.push(err.message || "Unexpected import error");
      toast.error("Fee import failed", { description: err.message || "Unexpected import error" });
      setStep("preview");
      return;
    }

    setSummary({
      total: totalAssignments,
      imported,
      skipped: collectedIssueRows.length,
      errors,
      errorDetails: importErrors,
      ignoredColumns,
      issueRows: collectedIssueRows,
      createdCategories,
      createdStructures,
      detectedCategories,
    });
    setStep("done");

    try {
      await supabase.from("import_logs" as any).insert({
        school_id: school.id,
        file_name: file?.name || "unknown",
        total_rows: feeRows.length,
        imported_count: imported,
        failed_count: collectedIssueRows.length + errors,
        ignored_columns: ignoredColumns,
        issue_rows: collectedIssueRows,
      });
      queryClient.invalidateQueries({ queryKey: ["import-logs"] });
    } catch (logErr) {
      console.error("Failed to save import log:", logErr);
    }

    queryClient.invalidateQueries({ queryKey: ["fee-categories"] });
    queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    queryClient.invalidateQueries({ queryKey: ["student-fees"] });
    queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    onComplete?.({ mode: "fees", imported, createdCategories, createdStructures });
  };

  const toggleStructure = (idx: number) => {
    setFeeStructures((prev) => prev.map((s) => (s._index === idx ? { ...s, _selected: !s._selected } : s)));
  };

  const structureStats = useMemo(() => {
    const selected = feeStructures.filter((s) => s._selected && !s._exists);
    const installments = selected.reduce((sum, s) => sum + s.installments.length, 0);
    return {
      total: feeStructures.length,
      selected: selected.length,
      duplicates: feeStructures.filter((s) => s._exists).length,
      installments,
    };
  }, [feeStructures]);

  const handleFeeStructureImport = async () => {
    if (!school?.id) return;

    const toImport = feeStructures.filter((s) => s._selected && !s._exists);
    if (toImport.length === 0) {
      toast.error("No fee structures selected to import");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    let resolvedYearId = effectiveYearId;
    if (!resolvedYearId) {
      try {
        resolvedYearId = await autoCreateAcademicYear();
      } catch (err: any) {
        toast.error("Failed to auto-create academic year", { description: err.message });
        setStep("preview");
        return;
      }
    }

    let createdCategories = 0;
    let createdStructures = 0;
    let createdInstallments = 0;
    let errors = 0;
    const importErrors: string[] = [];
    const collectedIssueRows: IssueRow[] = [];
    const total = toImport.length;

    // Preload existing categories + structures to avoid duplicates
    const { data: existingCats } = await supabase
      .from("fee_categories")
      .select("id, name")
      .eq("school_id", school.id);
    const catByName = new Map<string, string>();
    (existingCats || []).forEach((c: any) => catByName.set(normalizeText(c.name), c.id));

    const { data: existingStructures } = await supabase
      .from("fee_structures")
      .select("id, fee_category_id")
      .eq("school_id", school.id)
      .eq("academic_year_id", resolvedYearId);
    const existingStructureCats = new Set((existingStructures || []).map((s: any) => s.fee_category_id));

    for (let i = 0; i < toImport.length; i++) {
      const s = toImport[i];
      try {
        let categoryId = catByName.get(normalizeText(s.category_name));
        if (!categoryId) {
          const { data: newCat, error: catErr } = await supabase
            .from("fee_categories")
            .insert({
              school_id: school.id,
              name: s.category_name.trim(),
              description: "Imported from Excel",
              is_mandatory: s.is_mandatory,
            })
            .select("id")
            .single();
          if (catErr) throw catErr;
          categoryId = newCat.id;
          catByName.set(normalizeText(s.category_name), categoryId);
          createdCategories++;
        }

        // Skip if a structure for this category already exists in this year (safety)
        if (existingStructureCats.has(categoryId)) {
          collectedIssueRows.push({
            rowNumber: i + 1,
            studentName: s.category_name,
            className: "",
            section: "",
            rollNo: "",
            parentName: "",
            phone: "",
            issueType: "Already Exists",
            issueDetails: `A fee structure for "${s.category_name}" already exists in the selected academic year`,
            actionRequired: "Edit the existing structure or remove it before re-importing",
          });
          setImportProgress(Math.round(((i + 1) / total) * 100));
          continue;
        }

        const { data: newStructure, error: structErr } = await supabase
          .from("fee_structures")
          .insert({
            school_id: school.id,
            academic_year_id: resolvedYearId,
            fee_category_id: categoryId,
            total_amount: s.total_amount,
          })
          .select("id")
          .single();
        if (structErr) throw structErr;
        createdStructures++;
        existingStructureCats.add(categoryId);

        // Insert installments — fall back to default due date if none parsed
        const installmentRows = s.installments.map((inst, idx) => ({
          fee_structure_id: newStructure.id,
          name: inst.name,
          amount: inst.amount,
          due_date: inst.due_date || defaultDueDate || new Date().toISOString().slice(0, 10),
          display_order: idx + 1,
        }));

        if (installmentRows.length > 0) {
          const { error: instErr } = await supabase.from("installments").insert(installmentRows);
          if (instErr) throw instErr;
          createdInstallments += installmentRows.length;
        }
      } catch (err: any) {
        errors++;
        importErrors.push(`${s.category_name}: ${err.message}`);
        collectedIssueRows.push({
          rowNumber: i + 1,
          studentName: s.category_name,
          className: "",
          section: "",
          rollNo: "",
          parentName: "",
          phone: "",
          issueType: "Failed to Create",
          issueDetails: err.message,
          actionRequired: "Create this fee structure manually",
        });
      }

      setImportProgress(Math.round(((i + 1) / total) * 100));
    }

    // Skipped (deselected or pre-existing)
    feeStructures
      .filter((s) => !s._selected || s._exists)
      .forEach((s, idx) => {
        collectedIssueRows.push({
          rowNumber: idx + 1,
          studentName: s.category_name,
          className: "",
          section: "",
          rollNo: "",
          parentName: "",
          phone: "",
          issueType: s._exists ? "Already Exists" : "Skipped",
          issueDetails: s._exists ? "A category with this name already exists" : "Deselected by admin",
          actionRequired: s._exists ? "Edit the existing category if needed" : "Re-import if needed",
        });
      });

    setSummary({
      total,
      imported: createdStructures,
      skipped: collectedIssueRows.length,
      errors,
      errorDetails: importErrors,
      ignoredColumns,
      issueRows: collectedIssueRows,
      createdCategories,
      createdStructures,
      createdInstallments,
      detectedCategories,
    });
    setStep("done");

    try {
      await supabase.from("import_logs" as any).insert({
        school_id: school.id,
        file_name: file?.name || "unknown",
        total_rows: feeStructures.length,
        imported_count: createdStructures,
        failed_count: collectedIssueRows.length + errors,
        ignored_columns: ignoredColumns,
        issue_rows: collectedIssueRows,
      });
      queryClient.invalidateQueries({ queryKey: ["import-logs"] });
    } catch (logErr) {
      console.error("Failed to save import log:", logErr);
    }

    queryClient.invalidateQueries({ queryKey: ["fee-categories"] });
    queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    onComplete?.({ mode: "fees", imported: createdStructures, createdCategories, createdStructures, createdInstallments, format: "fee_structure" });
  };

  const handleImport = async () => {
    if (mode === "students") {
      await handleStudentImport();
      return;
    }
    if (feeFormat === "fee_structure") {
      await handleFeeStructureImport();
      return;
    }
    await handleFeeImport();
  };

  const title = mode === "students" ? "Import Students via Excel (AI)" : "Import Fees via Excel (AI)";
  const uploadDescription = mode === "students"
    ? "Upload any Excel or CSV file. AI will automatically map student columns — no reformatting needed."
    : "Upload a fee sheet — wide, long, or a fee structure template (no students needed). AI auto-detects the format.";
  const previewDescription = mode === "students"
    ? "Review the parsed data. Fix issues or deselect rows before importing."
    : "Review the detected fee categories, matched students, and skipped rows before importing.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && uploadDescription}
            {step === "preview" && previewDescription}
            {step === "importing" && (mode === "students" ? "Importing students..." : "Importing fee records...")}
            {step === "done" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Academic Year <span className="text-muted-foreground text-xs font-normal">(optional — auto-assigned if not selected)</span>
              </Label>
              <Select value={effectiveYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-assign active year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.is_active && "(Active)"}
                    </SelectItem>
                  ))}
                  <div
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInlineCreate(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Academic Year
                  </div>
                </SelectContent>
              </Select>

              {showInlineCreate && (
                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">New Academic Year</p>
                  <div className="space-y-2">
                    <Input placeholder="e.g. 2025-26" value={newYearName} onChange={(e) => setNewYearName(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={newYearStart} onChange={(e) => setNewYearStart(e.target.value)} />
                      <Input type="date" value={newYearEnd} onChange={(e) => setNewYearEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowInlineCreate(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleInlineCreate} disabled={isCreatingYear}>
                      {isCreatingYear && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {mode === "fees" && (
              <div className="space-y-2">
                <Label>Default Due Date</Label>
                <Input type="date" value={defaultDueDate} onChange={(e) => setDefaultDueDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">This date will be used for the auto-created Full Payment installment for new fee structures.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Excel / CSV File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">{file ? file.name : "Drag & drop or click to select a file"}</p>
                <Input type="file" accept=".xlsx,.csv" onChange={handleFileChange} className="max-w-xs mx-auto" />
              </div>
            </div>

            <Button onClick={handleProcess} disabled={!file || isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI is processing your file...
                </>
              ) : (
                "Process with AI"
              )}
            </Button>
          </div>
        )}

        {step === "preview" && mode === "students" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{studentStats.total} total rows</Badge>
              <Badge variant="default">{studentStats.selected} selected</Badge>
              {studentStats.issues > 0 && <Badge variant="destructive">{studentStats.issues} with issues</Badge>}
              {studentStats.strongDupes > 0 && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/30">🔴 {studentStats.strongDupes} duplicate{studentStats.strongDupes !== 1 ? "s" : ""} blocked</Badge>
              )}
              {studentStats.softDupes > 0 && (
                <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">🟡 {studentStats.softDupes} possible duplicate{studentStats.softDupes !== 1 ? "s" : ""}</Badge>
              )}
            </div>

            {sheetSummary && sheetSummary.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-primary mb-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Detected {sheetSummary.length} class sheet{sheetSummary.length !== 1 ? "s" : ""}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sheetSummary.map((sheet) => `${sheet.className}${sheet.section ? ` ${sheet.section}` : ""} (${sheet.rowCount})`).join(" · ")}
                </p>
                {ignoredSheets.length > 0 && <p className="text-xs text-muted-foreground mt-1">Ignored sheets: {ignoredSheets.join(", ")}</p>}
              </div>
            )}

            {ignoredColumns.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-primary mb-1">
                  <Info className="h-3.5 w-3.5" /> {ignoredColumns.length} column{ignoredColumns.length > 1 ? "s" : ""} ignored
                </div>
                <p className="text-xs text-muted-foreground">{ignoredColumns.join(", ")}</p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-amber-700 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </div>
                {warnings.slice(0, 5).map((warning, index) => (
                  <p key={index} className="text-amber-700 text-xs">{warning}</p>
                ))}
                {warnings.length > 5 && <p className="text-amber-700 text-xs mt-1">...and {warnings.length - 5} more</p>}
              </div>
            )}

            <div className="flex-1 min-h-0 max-h-[45vh] overflow-auto rounded-md border">
              <div className="min-w-[980px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">✓</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const hasIssues = row._issues.length > 0;
                      const rowClass = hasIssues
                        ? "bg-destructive/5"
                        : row._duplicateType === "strong"
                          ? "bg-destructive/5"
                          : row._duplicateType === "soft"
                            ? "bg-amber-500/10"
                            : "";

                      return (
                        <TableRow key={row._rowIndex} className={rowClass}>
                          <TableCell>
                            <Checkbox checked={row._selected} onCheckedChange={() => toggleStudentRow(row._rowIndex)} disabled={hasIssues} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.name} onChange={(e) => editField(row._rowIndex, "name", e.target.value)} className="h-7 text-xs min-w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.class_name} onChange={(e) => editField(row._rowIndex, "class_name", e.target.value)} className="h-7 text-xs w-20" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.section} onChange={(e) => editField(row._rowIndex, "section", e.target.value)} className="h-7 text-xs w-12" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.roll_number} onChange={(e) => editField(row._rowIndex, "roll_number", e.target.value)} className="h-7 text-xs w-24" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.parent_name} onChange={(e) => editField(row._rowIndex, "parent_name", e.target.value)} className="h-7 text-xs min-w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.parent_phone} onChange={(e) => editField(row._rowIndex, "parent_phone", e.target.value)} className="h-7 text-xs w-28" />
                          </TableCell>
                          <TableCell>
                            {hasIssues ? (
                              <span className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" />{row._issues[0]}</span>
                            ) : row._duplicateType === "strong" ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-destructive flex items-center gap-1 cursor-help"><XCircle className="h-3 w-3" />Duplicate</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-[250px]">
                                    <p className="text-xs">{row._duplicateReason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : row._duplicateType === "soft" ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-amber-700 flex items-center gap-1 cursor-help"><AlertTriangle className="h-3 w-3" />Possible Duplicate</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-[250px]">
                                    <p className="text-xs">{row._duplicateReason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Valid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={handleImport} disabled={studentStats.selected === 0}>Import {studentStats.selected} Students</Button>
            </div>
          </div>
        )}

        {step === "preview" && mode === "fees" && feeFormat === "fee_structure" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-primary mb-2">
                <Info className="h-4 w-4" />
                <span>📊 Detected Fee Structures</span>
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-xs">
                <div><span className="text-muted-foreground">Categories:</span> <span className="font-semibold">{structureStats.total}</span></div>
                <div><span className="text-muted-foreground">Selected:</span> <span className="font-semibold">{structureStats.selected}</span></div>
                <div><span className="text-muted-foreground">Installments:</span> <span className="font-semibold">{structureStats.installments}</span></div>
              </div>
              {structureStats.duplicates > 0 && (
                <p className="text-xs text-amber-700 mt-2">⚠️ {structureStats.duplicates} categor{structureStats.duplicates === 1 ? "y" : "ies"} already exist and will be skipped.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Default Due Date <span className="text-muted-foreground text-xs font-normal">(used when Excel doesn't specify a date)</span></Label>
              <Input type="date" value={defaultDueDate} onChange={(e) => setDefaultDueDate(e.target.value)} />
            </div>

            {ignoredColumns.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-primary mb-1">
                  <Info className="h-3.5 w-3.5" /> {ignoredColumns.length} column{ignoredColumns.length > 1 ? "s" : ""} ignored
                </div>
                <p className="text-xs text-muted-foreground">{ignoredColumns.join(", ")}</p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-amber-700 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </div>
                {warnings.map((w, i) => <p key={i} className="text-amber-700 text-xs">{w}</p>)}
              </div>
            )}

            <div className="flex-1 min-h-0 max-h-[45vh] overflow-auto rounded-md border p-2 space-y-2">
              {feeStructures.map((s) => (
                <div key={s._index} className={`rounded-md border p-3 ${s._exists ? "bg-muted/40" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={s._selected} onCheckedChange={() => toggleStructure(s._index)} disabled={s._exists} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{s.category_name}</p>
                        {s.is_mandatory && <Badge variant="secondary" className="text-xs">Mandatory</Badge>}
                        {s._exists && <Badge variant="outline" className="text-xs text-amber-700 border-amber-500/30">Already exists</Badge>}
                        <Badge variant="outline" className="text-xs">Total: {formatCurrencyValue(s.total_amount)}</Badge>
                      </div>
                      <div className="mt-2 grid gap-1">
                        {s.installments.map((inst, idx) => (
                          <div key={idx} className="text-xs flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                            <span>{inst.name}</span>
                            <span className="text-muted-foreground">{formatCurrencyValue(inst.amount)}{inst.due_date ? ` · ${inst.due_date}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={handleImport} disabled={structureStats.selected === 0}>
                Import {structureStats.selected} Structure{structureStats.selected !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && mode === "fees" && feeFormat !== "fee_structure" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 font-medium text-primary mb-3">
                <Info className="h-4 w-4" />
                <span>Fee Import Preview</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Categories detected</p>
                  <div className="flex flex-wrap gap-1">
                    {detectedCategories.length > 0 ? detectedCategories.map((category) => (
                      <Badge key={category} variant="secondary">{category}</Badge>
                    )) : <span className="text-muted-foreground">None</span>}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Students matched</p>
                  <p className="font-semibold">{feeStats.uniqueMatchedStudents} students</p>
                  <p className="text-xs text-muted-foreground">{feeStats.selectedAssignments} fee record{feeStats.selectedAssignments !== 1 ? "s" : ""} ready to import</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Issues</p>
                  <p className="font-semibold">{feeStats.issueRows} row{feeStats.issueRows !== 1 ? "s" : ""} skipped</p>
                  {feeStats.issueRows > 0 && feeStats.matchedRows < feeStats.totalRows && (
                    <p className="text-xs text-muted-foreground">Tip: import missing students first, then retry.</p>
                  )}
                  {warnings.length > 0 && <p className="text-xs text-muted-foreground">{warnings[0]}</p>}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Default Due Date</Label>
                <Input type="date" value={defaultDueDate} onChange={(e) => setDefaultDueDate(e.target.value)} />
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Auto-created fee structures will use this date for their Full Payment installment.</span>
              </div>
            </div>

            {sheetSummary && sheetSummary.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-primary mb-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Detected {sheetSummary.length} class sheet{sheetSummary.length !== 1 ? "s" : ""}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sheetSummary.map((sheet) => `${sheet.className}${sheet.section ? ` ${sheet.section}` : ""} (${sheet.rowCount})`).join(" · ")}
                </p>
                {ignoredSheets.length > 0 && <p className="text-xs text-muted-foreground mt-1">Ignored sheets: {ignoredSheets.join(", ")}</p>}
              </div>
            )}

            {ignoredColumns.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-primary mb-1">
                  <Info className="h-3.5 w-3.5" /> {ignoredColumns.length} column{ignoredColumns.length > 1 ? "s" : ""} ignored
                </div>
                <p className="text-xs text-muted-foreground">{ignoredColumns.join(", ")}</p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-amber-700 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </div>
                {warnings.map((warning, index) => (
                  <p key={index} className="text-amber-700 text-xs">{warning}</p>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0 max-h-[45vh] overflow-auto rounded-md border">
              <div className="min-w-[980px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">✓</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Fees Detected</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeRows.map((row) => {
                      const hasIssues = row._issues.length > 0;
                      return (
                        <TableRow key={`${row._rowIndex}-${row.row_number}`} className={hasIssues ? "bg-destructive/5" : ""}>
                          <TableCell>
                            <Checkbox checked={row._selected} onCheckedChange={() => toggleFeeRow(row._rowIndex)} disabled={hasIssues} />
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[150px]">
                              <p className="text-sm font-medium">{row.student_name || "—"}</p>
                              {row.section && <p className="text-xs text-muted-foreground">Section {row.section}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{row.class_name || "—"}</TableCell>
                          <TableCell>{row.roll_number || "—"}</TableCell>
                          <TableCell>
                            <div className="min-w-[260px] space-y-1">
                              {row.fees.length > 0 ? row.fees.map((fee, index) => (
                                <div key={`${fee.category_name}-${index}`} className="text-xs rounded-md bg-muted/50 px-2 py-1">
                                  {fee.category_name} — {formatCurrencyValue(fee.amount)}
                                </div>
                              )) : <span className="text-xs text-muted-foreground">No fee amounts</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {row._matchedStudentId ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-green-600 flex items-center gap-1 cursor-help">
                                      <CheckCircle2 className="h-3 w-3" />
                                      {row._matchedStudentName || "Matched"}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p className="text-xs">{row._matchReason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-xs text-destructive flex items-center gap-1">
                                <XCircle className="h-3 w-3" />Student not found
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasIssues ? (
                              <span className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" />{row._issues[0]}</span>
                            ) : (
                              <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Ready</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={handleImport} disabled={feeStats.selectedAssignments === 0 || !defaultDueDate}>Import {feeStats.selectedAssignments} Fee Records</Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm text-muted-foreground">{mode === "students" ? "Importing students..." : "Importing fee records..."}</p>
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">{importProgress}%</p>
          </div>
        )}

        {step === "done" && summary && (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-600" />
              <p className="font-semibold text-lg">Import Complete</p>
            </div>

            <div className="space-y-2 max-w-xl mx-auto text-sm">
              {summary.imported > 0 && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    {mode === "students"
                      ? `✅ ${summary.imported} student${summary.imported !== 1 ? "s" : ""} imported successfully`
                      : `✅ ${summary.imported} fee record${summary.imported !== 1 ? "s" : ""} imported`}
                  </span>
                </div>
              )}
              {summary.skipped > 0 && (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    {mode === "students"
                      ? `⚠️ ${summary.skipped} row${summary.skipped !== 1 ? "s" : ""} skipped (deselected or invalid)`
                      : `⚠️ ${summary.skipped} issue${summary.skipped !== 1 ? "s" : ""} logged`}
                  </span>
                </div>
              )}
              {summary.createdCategories ? (
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>ℹ️ {summary.createdCategories} new categor{summary.createdCategories === 1 ? "y" : "ies"} created</span>
                </div>
              ) : null}
              {summary.createdStructures ? (
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>ℹ️ {summary.createdStructures} new fee structure{summary.createdStructures === 1 ? "" : "s"} created</span>
                </div>
              ) : null}
              {summary.errors > 0 && (
                <div className="flex items-start gap-2 text-destructive">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span>❌ {summary.errors} error{summary.errors !== 1 ? "s" : ""}</span>
                    {summary.errorDetails.length > 0 && (
                      <ul className="text-xs mt-1 space-y-0.5 list-disc list-inside">
                        {summary.errorDetails.slice(0, 5).map((error, index) => <li key={index}>{error}</li>)}
                        {summary.errorDetails.length > 5 && <li>...and {summary.errorDetails.length - 5} more</li>}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {summary.ignoredColumns.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>ℹ️ {summary.ignoredColumns.length} column{summary.ignoredColumns.length !== 1 ? "s" : ""} ignored: {summary.ignoredColumns.join(", ")}</span>
                </div>
              )}
              {mode === "fees" && (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                  ✨ Fee setup was auto-created from your Excel file. You can edit or add more fees anytime.
                </div>
              )}
              {sheetSummary && sheetSummary.length > 0 && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div>Class-wise breakdown: {sheetSummary.map((sheet) => `${sheet.className}${sheet.section ? ` ${sheet.section}` : ""} (${sheet.rowCount})`).join(" · ")}</div>
                    {ignoredSheets.length > 0 && <div className="mt-0.5">Ignored sheets: {ignoredSheets.join(", ")}</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              {(summary.issueRows.length > 0 || summary.ignoredColumns.length > 0) && (
                <Button variant="outline" onClick={() => generateImportReport(summary.issueRows, summary.ignoredColumns)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Issues Report
                </Button>
              )}
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
