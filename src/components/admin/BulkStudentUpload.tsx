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
import { Upload, Loader2, AlertTriangle, CheckCircle2, XCircle, FileSpreadsheet, Plus, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYears, useActiveAcademicYear, useCreateAcademicYear } from "@/hooks/useAcademicYears";
import { useStudents } from "@/hooks/useStudents";
import { useQueryClient } from "@tanstack/react-query";

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

type DuplicateType = 'strong' | 'soft' | null;

interface ProcessedRow extends ParsedStudent {
  _rowIndex: number;
  _selected: boolean;
  _issues: string[];
  _isDuplicate: boolean;
  _duplicateType: DuplicateType;
  _duplicateReason?: string;
}

interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
  ignoredColumns: string[];
}

type Step = "upload" | "preview" | "importing" | "done";

interface BulkStudentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkStudentUpload({ open, onOpenChange }: BulkStudentUploadProps) {
  const { data: school } = useSchool();
  const { data: academicYears } = useAcademicYears();
  const activeAcademicYear = useActiveAcademicYear();
  const { data: existingStudents } = useStudents();
  const createYear = useCreateAcademicYear();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [academicYearId, setAcademicYearId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ignoredColumns, setIgnoredColumns] = useState<string[]>([]);
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep("upload");
      setFile(null);
      setAcademicYearId("");
      setRows([]);
      setWarnings([]);
      setIgnoredColumns([]);
      setImportProgress(0);
      setSummary(null);
      setIsProcessing(false);
      setShowInlineCreate(false);
      setNewYearName("");
      setNewYearStart("");
      setNewYearEnd("");
    }
    onOpenChange(open);
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

      // Strong matches — auto-deselect
      const aadhaarMatch = row.aadhaar_number?.trim() &&
        existingStudents.find((s) => s.aadhaar_number && s.aadhaar_number === row.aadhaar_number.trim());
      if (aadhaarMatch) return { isDuplicate: true, duplicateType: 'strong', reason: `Aadhaar match: ${aadhaarMatch.name}, ${aadhaarMatch.class_name || 'N/A'}` };

      const rollClassMatch = row.roll_number?.trim() && row.class_name?.trim() &&
        existingStudents.find((s) => s.roll_number === row.roll_number.trim() && s.class_name === row.class_name.trim());
      if (rollClassMatch) return { isDuplicate: true, duplicateType: 'strong', reason: `Roll+Class match: ${rollClassMatch.name}, Roll ${rollClassMatch.roll_number}, ${rollClassMatch.class_name}` };

      const nameClassMatch = existingStudents.find(
        (s) => s.name?.toLowerCase().trim() === row.name?.toLowerCase().trim() && s.class_name === row.class_name?.trim()
      );
      if (nameClassMatch) return { isDuplicate: true, duplicateType: 'strong', reason: `Name+Class match: ${nameClassMatch.name}, ${nameClassMatch.class_name}` };

      // Soft matches — warn but keep selected
      const phoneMatch = row.parent_phone?.trim() &&
        existingStudents.find((s) => s.parent_phone && s.parent_phone === row.parent_phone.trim());
      if (phoneMatch) return { isDuplicate: true, duplicateType: 'soft', reason: `Same phone as: ${phoneMatch.name}, ${phoneMatch.class_name || 'N/A'}` };

      const nameSectionMatch = existingStudents.find(
        (s) => s.name?.toLowerCase().trim() === row.name?.toLowerCase().trim() && s.section === row.section?.trim() && s.class_name !== row.class_name?.trim()
      );
      if (nameSectionMatch) return { isDuplicate: true, duplicateType: 'soft', reason: `Same name+section (diff class): ${nameSectionMatch.name}, ${nameSectionMatch.class_name}` };

      return { isDuplicate: false, duplicateType: null };
    },
    [existingStudents]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "csv") {
        toast.error("Please upload a .xlsx or .csv file");
        return;
      }
      setFile(selected);
    }
  };

  const autoCreateAcademicYear = async (): Promise<string> => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    const yearName = `${currentYear}-${String(nextYear).slice(2)}`;
    const startDate = now.toISOString().split("T")[0];
    const endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split("T")[0];
    const result = await createYear.mutateAsync({ name: yearName, start_date: startDate, end_date: endDate, is_active: true });
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
      const result = await createYear.mutateAsync({ name: newYearName.trim(), start_date: newYearStart, end_date: newYearEnd, is_active: true });
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

      const { data, error } = await supabase.functions.invoke("process-student-excel", {
        body: { fileBase64, fileName: file.name },
      });

      if (error) throw new Error(error.message);
      if (!data?.students || !Array.isArray(data.students)) throw new Error("Invalid response from AI processing");

      const processed: ProcessedRow[] = data.students.map((s: ParsedStudent, i: number) => {
        const issues = validateRow(s);
        const { isDuplicate, duplicateType, reason } = checkDuplicate(s);
        const autoDeselect = issues.length > 0 || duplicateType === 'strong';
        return { ...s, _rowIndex: i, _selected: !autoDeselect, _issues: issues, _isDuplicate: isDuplicate, _duplicateType: duplicateType, _duplicateReason: reason };
      });

      setRows(processed);
      setWarnings(data.warnings || []);
      setIgnoredColumns(data.ignoredColumns || []);
      setStep("preview");
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error("Failed to process file", { description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRow = (index: number) => {
    setRows((prev) => prev.map((r) => (r._rowIndex === index ? { ...r, _selected: !r._selected } : r)));
  };

  const editField = (index: number, field: keyof ParsedStudent, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._rowIndex !== index) return r;
        const updated = { ...r, [field]: value };
        updated._issues = validateRow(updated);
        return updated;
      })
    );
  };

  const stats = useMemo(() => {
    const selected = rows.filter((r) => r._selected);
    const withIssues = rows.filter((r) => r._issues.length > 0);
    const duplicates = rows.filter((r) => r._isDuplicate);
    return { total: rows.length, selected: selected.length, issues: withIssues.length, duplicates: duplicates.length };
  }, [rows]);

  const handleImport = async () => {
    if (!school?.id) return;
    const toImport = rows.filter((r) => r._selected && r._issues.length === 0);
    if (toImport.length === 0) { toast.error("No valid rows to import"); return; }

    setStep("importing");
    setImportProgress(0);

    let resolvedYearId = effectiveYearId;
    if (!resolvedYearId) {
      try {
        resolvedYearId = await autoCreateAcademicYear();
      } catch (err: any) {
        console.error("Auto-create year error:", err);
        toast.error("Failed to auto-create academic year", { description: err.message });
        setStep("upload");
        return;
      }
    }

    let imported = 0;
    let errors = 0;
    const importErrors: string[] = [];

    for (let i = 0; i < toImport.length; i++) {
      const r = toImport[i];
      try {
        const studentData = {
          school_id: school.id,
          name: r.name.trim(),
          roll_number: r.roll_number?.trim() || null,
          class_name: r.class_name?.trim() || null,
          section: r.section?.trim() || "A",
          parent_name: r.parent_name?.trim() || null,
          parent_phone: r.parent_phone?.trim() || null,
          parent_email: r.parent_email?.trim() || null,
          guardian: r.guardian?.trim() || null,
          address: r.address?.trim() || null,
          gender: r.gender?.trim() || null,
          date_of_birth: r.date_of_birth?.trim() || null,
          social_category: r.social_category?.trim() || null,
          aadhaar_number: r.aadhaar_number?.trim() || null,
          religion: r.religion?.trim() || null,
        };

        const { data: insertedStudent, error } = await supabase
          .from("students")
          .insert(studentData)
          .select("id, class_name, section")
          .single();

        if (error) {
          errors++;
          importErrors.push(`Row ${r._rowIndex + 1} (${r.name}): ${error.message}`);
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
        importErrors.push(`Row ${r._rowIndex + 1} (${r.name}): ${rowErr.message}`);
      }

      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    const skipped = rows.length - toImport.length;
    setSummary({ total: rows.length, imported, skipped, errors, errorDetails: importErrors, ignoredColumns });
    setStep("done");

    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
    queryClient.invalidateQueries({ queryKey: ["student-fees"] });
    queryClient.invalidateQueries({ queryKey: ["academic-years"] });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Students via Excel (AI)
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload any Excel or CSV file. AI will automatically map columns — no reformatting needed."}
            {step === "preview" && "Review the parsed data. Fix issues or deselect rows before importing."}
            {step === "importing" && "Importing students..."}
            {step === "done" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Academic Year <span className="text-muted-foreground text-xs font-normal">(optional — auto-assigned if not selected)</span></Label>
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
                    onClick={(e) => { e.stopPropagation(); setShowInlineCreate(true); }}
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
                    <Button variant="ghost" size="sm" onClick={() => setShowInlineCreate(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleInlineCreate} disabled={isCreatingYear}>
                      {isCreatingYear && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Excel / CSV File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {file ? file.name : "Drag & drop or click to select a file"}
                </p>
                <Input type="file" accept=".xlsx,.csv" onChange={handleFileChange} className="max-w-xs mx-auto" />
              </div>
            </div>

            <Button onClick={handleProcess} disabled={!file || isProcessing} className="w-full">
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI is processing your file...</>
              ) : (
                "Process with AI"
              )}
            </Button>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{stats.total} total rows</Badge>
              <Badge variant="default">{stats.selected} selected</Badge>
              {stats.issues > 0 && <Badge variant="destructive">{stats.issues} with issues</Badge>}
              {stats.duplicates > 0 && (
                <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">{stats.duplicates} duplicates</Badge>
              )}
            </div>

            {ignoredColumns.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-blue-800 dark:text-blue-200 mb-1">
                  <Info className="h-3.5 w-3.5" /> {ignoredColumns.length} column{ignoredColumns.length > 1 ? "s" : ""} ignored
                </div>
                <p className="text-blue-700 dark:text-blue-300 text-xs">{ignoredColumns.join(", ")}</p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </div>
                {warnings.slice(0, 5).map((w, i) => (
                  <p key={i} className="text-yellow-700 dark:text-yellow-300 text-xs">{w}</p>
                ))}
                {warnings.length > 5 && (
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">...and {warnings.length - 5} more</p>
                )}
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
                      const rowClass = hasIssues ? "bg-destructive/5" : row._isDuplicate ? "bg-yellow-50 dark:bg-yellow-900/10" : "";
                      return (
                        <TableRow key={row._rowIndex} className={rowClass}>
                          <TableCell>
                            <Checkbox checked={row._selected} onCheckedChange={() => toggleRow(row._rowIndex)} disabled={hasIssues} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.name} onChange={(e) => editField(row._rowIndex, "name", e.target.value)} className="h-7 text-xs min-w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.class_name} onChange={(e) => editField(row._rowIndex, "class_name", e.target.value)} className="h-7 text-xs w-16" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.section} onChange={(e) => editField(row._rowIndex, "section", e.target.value)} className="h-7 text-xs w-12" />
                          </TableCell>
                          <TableCell>
                            <Input value={row.roll_number} onChange={(e) => editField(row._rowIndex, "roll_number", e.target.value)} className="h-7 text-xs w-20" />
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
                            ) : row._isDuplicate ? (
                              <span className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Duplicate</span>
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
              <Button onClick={handleImport} disabled={stats.selected === 0}>Import {stats.selected} Students</Button>
            </div>
          </div>
        )}

        {/* STEP 3: Importing */}
        {step === "importing" && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm text-muted-foreground">Importing students...</p>
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">{importProgress}%</p>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === "done" && summary && (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-600" />
              <p className="font-semibold text-lg">Import Complete</p>
            </div>

            <div className="space-y-2 max-w-sm mx-auto text-sm">
              {summary.imported > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>✅ {summary.imported} student{summary.imported !== 1 ? "s" : ""} imported successfully</span>
                </div>
              )}
              {summary.skipped > 0 && (
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>⚠️ {summary.skipped} row{summary.skipped !== 1 ? "s" : ""} skipped (deselected or invalid)</span>
                </div>
              )}
              {summary.errors > 0 && (
                <div className="flex items-start gap-2 text-destructive">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span>❌ {summary.errors} row{summary.errors !== 1 ? "s" : ""} failed</span>
                    {summary.errorDetails.length > 0 && (
                      <ul className="text-xs mt-1 space-y-0.5 list-disc list-inside">
                        {summary.errorDetails.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
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
            </div>

            <div className="flex justify-center">
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
