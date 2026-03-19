import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Loader2, AlertTriangle, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYears, useActiveAcademicYear } from "@/hooks/useAcademicYears";
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
}

interface ProcessedRow extends ParsedStudent {
  _rowIndex: number;
  _selected: boolean;
  _issues: string[];
  _isDuplicate: boolean;
  _duplicateReason?: string;
}

interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
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
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [academicYearId, setAcademicYearId] = useState(activeAcademicYear?.id || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep("upload");
      setFile(null);
      setRows([]);
      setWarnings([]);
      setImportProgress(0);
      setSummary(null);
      setIsProcessing(false);
    }
    onOpenChange(open);
  };

  // Validate a row and return issues
  const validateRow = useCallback((row: ParsedStudent): string[] => {
    const issues: string[] = [];
    if (!row.name?.trim()) issues.push("Missing name");
    if (!row.parent_phone?.trim()) issues.push("Missing phone");
    return issues;
  }, []);

  // Check for duplicates against existing students
  const checkDuplicate = useCallback(
    (row: ParsedStudent): { isDuplicate: boolean; reason?: string } => {
      if (!existingStudents) return { isDuplicate: false };
      const match = existingStudents.find(
        (s) =>
          s.name?.toLowerCase() === row.name?.toLowerCase() &&
          s.parent_phone === row.parent_phone &&
          s.class_name === row.class_name
      );
      if (match) {
        return { isDuplicate: true, reason: `Matches existing: ${match.name} (${match.class_name})` };
      }
      return { isDuplicate: false };
    },
    [existingStudents]
  );

  // Handle file selection
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

  // Send file to edge function for AI processing
  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("process-student-excel", {
        body: { fileBase64, fileName: file.name },
      });

      if (error) throw new Error(error.message);

      if (!data?.students || !Array.isArray(data.students)) {
        throw new Error("Invalid response from AI processing");
      }

      // Process rows with validation
      const processed: ProcessedRow[] = data.students.map((s: ParsedStudent, i: number) => {
        const issues = validateRow(s);
        const { isDuplicate, reason } = checkDuplicate(s);
        return {
          ...s,
          _rowIndex: i,
          _selected: issues.length === 0 && !isDuplicate,
          _issues: issues,
          _isDuplicate: isDuplicate,
          _duplicateReason: reason,
        };
      });

      setRows(processed);
      setWarnings(data.warnings || []);
      setStep("preview");
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error("Failed to process file", { description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle row selection
  const toggleRow = (index: number) => {
    setRows((prev) =>
      prev.map((r) => (r._rowIndex === index ? { ...r, _selected: !r._selected } : r))
    );
  };

  // Inline edit a field
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

  // Stats
  const stats = useMemo(() => {
    const selected = rows.filter((r) => r._selected);
    const withIssues = rows.filter((r) => r._issues.length > 0);
    const duplicates = rows.filter((r) => r._isDuplicate);
    return {
      total: rows.length,
      selected: selected.length,
      issues: withIssues.length,
      duplicates: duplicates.length,
    };
  }, [rows]);

  // Bulk import
  const handleImport = async () => {
    if (!school?.id) return;

    const toImport = rows.filter((r) => r._selected && r._issues.length === 0);
    if (toImport.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    let imported = 0;
    let errors = 0;
    const chunkSize = 50;

    for (let i = 0; i < toImport.length; i += chunkSize) {
      const chunk = toImport.slice(i, i + chunkSize);

      const studentInserts = chunk.map((r) => ({
        school_id: school.id,
        name: r.name.trim(),
        roll_number: r.roll_number?.trim() || null,
        class_name: r.class_name?.trim() || null,
        section: r.section?.trim() || null,
        parent_name: r.parent_name?.trim() || null,
        parent_phone: r.parent_phone?.trim() || null,
        parent_email: r.parent_email?.trim() || null,
        guardian: r.guardian?.trim() || null,
        address: r.address?.trim() || null,
      }));

      const { data: insertedStudents, error } = await supabase
        .from("students")
        .insert(studentInserts)
        .select("id, class_name, section");

      if (error) {
        console.error("Insert error:", error);
        errors += chunk.length;
      } else {
        imported += insertedStudents.length;

        // Create enrollments if academic year selected
        if (academicYearId && insertedStudents.length > 0) {
          const enrollments = insertedStudents.map((s) => ({
            student_id: s.id,
            academic_year_id: academicYearId,
            class_name: s.class_name,
            section: s.section,
          }));

          const { error: enrollError } = await supabase
            .from("student_enrollments")
            .insert(enrollments);

          if (enrollError) {
            console.error("Enrollment error:", enrollError);
          }
        }
      }

      setImportProgress(Math.round(((i + chunk.length) / toImport.length) * 100));
    }

    const skipped = rows.length - toImport.length;
    setSummary({ total: rows.length, imported, skipped, errors });
    setStep("done");

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
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
            {step === "upload" && "Upload an Excel or CSV file. AI will automatically map and clean your data."}
            {step === "preview" && "Review the parsed data. Fix issues or deselect rows before importing."}
            {step === "importing" && "Importing students..."}
            {step === "done" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.is_active && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Excel / CSV File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {file ? file.name : "Drag & drop or click to select a file"}
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  className="max-w-xs mx-auto"
                />
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

        {/* STEP 2: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Stats banner */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{stats.total} total rows</Badge>
              <Badge variant="default">{stats.selected} selected</Badge>
              {stats.issues > 0 && (
                <Badge variant="destructive">{stats.issues} with issues</Badge>
              )}
              {stats.duplicates > 0 && (
                <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                  {stats.duplicates} duplicates
                </Badge>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2 text-sm">
                <div className="flex items-center gap-1 font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </div>
                {warnings.slice(0, 5).map((w, i) => (
                  <p key={i} className="text-yellow-700 dark:text-yellow-300 text-xs">{w}</p>
                ))}
              </div>
            )}

            <ScrollArea className="flex-1 border rounded-md max-h-[45vh]" type="always">
              <div className="min-w-[800px]">
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
                      : row._isDuplicate
                      ? "bg-yellow-50 dark:bg-yellow-900/10"
                      : "";

                    return (
                      <TableRow key={row._rowIndex} className={rowClass}>
                        <TableCell>
                          <Checkbox
                            checked={row._selected}
                            onCheckedChange={() => toggleRow(row._rowIndex)}
                            disabled={hasIssues}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => editField(row._rowIndex, "name", e.target.value)}
                            className="h-7 text-xs min-w-[120px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.class_name}
                            onChange={(e) => editField(row._rowIndex, "class_name", e.target.value)}
                            className="h-7 text-xs w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.section}
                            onChange={(e) => editField(row._rowIndex, "section", e.target.value)}
                            className="h-7 text-xs w-12"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.roll_number}
                            onChange={(e) => editField(row._rowIndex, "roll_number", e.target.value)}
                            className="h-7 text-xs w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.parent_name}
                            onChange={(e) => editField(row._rowIndex, "parent_name", e.target.value)}
                            className="h-7 text-xs min-w-[100px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.parent_phone}
                            onChange={(e) => editField(row._rowIndex, "parent_phone", e.target.value)}
                            className="h-7 text-xs w-28"
                          />
                        </TableCell>
                        <TableCell>
                          {hasIssues ? (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              {row._issues[0]}
                            </span>
                          ) : row._isDuplicate ? (
                            <span className="text-xs text-yellow-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Duplicate
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={stats.selected === 0}>
                Import {stats.selected} Students
              </Button>
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
          <div className="py-8 space-y-4">
            <div className="text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-600" />
              <p className="font-semibold text-lg">Import Complete</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-sm">
              <div className="text-muted-foreground">Total rows:</div>
              <div className="font-medium">{summary.total}</div>
              <div className="text-muted-foreground">Imported:</div>
              <div className="font-medium text-green-600">{summary.imported}</div>
              <div className="text-muted-foreground">Skipped:</div>
              <div className="font-medium text-yellow-600">{summary.skipped}</div>
              {summary.errors > 0 && (
                <>
                  <div className="text-muted-foreground">Errors:</div>
                  <div className="font-medium text-destructive">{summary.errors}</div>
                </>
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
