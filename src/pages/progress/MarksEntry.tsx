import { useState, useMemo, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useMyClassAssignments } from "@/hooks/useTeacherClasses";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssessments } from "@/hooks/progress/useAssessments";
import { useSubjects } from "@/hooks/progress/useSubjects";
import { useMySubjectIds } from "@/hooks/progress/useMySubjectIds";
import { useSaveMarks, useStudentMarks } from "@/hooks/progress/useStudentMarks";
import { useResolvedAcademicYears, useResolvedActiveAcademicYear } from "@/hooks/progress/useResolvedAcademicYears";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import {
  useClassTemplateAssignments,
  useTemplateComponents,
  useTemplateGradeMappings,
} from "@/hooks/progress/useAssessmentTemplates";
import { useComponentMarks } from "@/hooks/progress/useComponentMarks";
import { computeStudentResult } from "@/lib/marks-engine";
import { PenLine, Save, Loader2, Upload } from "lucide-react";
import { MarksImportDialog } from "@/components/progress/marks-import/MarksImportDialog";
import { useToast } from "@/hooks/use-toast";
import { CompetencyScoring } from "@/components/progress/CompetencyScoring";
import { sortClassNames } from "@/lib/class-sort";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator, LastSavedLabel } from "@/components/auto-save/AutoSaveIndicator";
import { DraftRecoveryBanner } from "@/components/auto-save/DraftRecoveryBanner";

const MARKS_AUTO_SAVE_IDLE_MS = 2_500;

type MarksDraft = {
  hasTemplate: boolean;
  legacyMarks: Record<string, { marksObtained: string; maxMarks: string }>;
  componentMarksInput: ComponentMarksMap;
};

// Per-student, per-component raw mark input
type ComponentMarksMap = Record<string, Record<string, string>>; // studentId → componentId → value
// Tracks which fields have validation errors: studentId → fieldKey → error message
type ValidationErrorsMap = Record<string, Record<string, string>>;

export default function MarksEntry() {
  const { data: academicYears = [] } = useResolvedAcademicYears();
  const activeYear = useResolvedActiveAcademicYear();
  const { isTeacher } = useUserRole();
  const { data: myClassAssignments = [] } = useMyClassAssignments();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const { data: students = [] } = useResolvedStudents();
  const saveMarks = useSaveMarks();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Legacy mode state (no template)
  const [legacyMarks, setLegacyMarks] = useState<Record<string, { marksObtained: string; maxMarks: string }>>({});
  const [defaultMaxMarks, setDefaultMaxMarks] = useState("100");

  // Template mode state
  const [componentMarksInput, setComponentMarksInput] = useState<ComponentMarksMap>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrorsMap>({});
  const [hasUserEditedMarks, setHasUserEditedMarks] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Fetch template assignment for selected class + year
  const { data: classAssignments = [] } = useClassTemplateAssignments(effectiveYearId || null);

  const assignedTemplate = useMemo(() => {
    if (!selectedClass) return null;
    return classAssignments.find(a => a.class_name === selectedClass) ?? null;
  }, [classAssignments, selectedClass]);

  const templateId = assignedTemplate?.template_id ?? null;
  const hasTemplate = !!templateId;

  // Load template components and grade mappings
  const { data: templateComponents = [] } = useTemplateComponents(templateId);
  const { data: gradeMappings = [] } = useTemplateGradeMappings(templateId);

  // Fetch data
  const { data: assessments = [] } = useAssessments(effectiveYearId, selectedClass || undefined);
  const { getSubjectIdsForClass, mySubjectIds } = useMySubjectIds();
  // For teachers: filter subjects to only those assigned for the selected class
  const teacherSubjectIdsForClass = selectedClass ? getSubjectIdsForClass(selectedClass) : mySubjectIds ?? undefined;
  const { data: subjects = [], isLoading: isLoadingSubjects } = useSubjects(selectedClass || undefined, teacherSubjectIdsForClass ?? undefined);
  const { data: existingMarks = [] } = useStudentMarks(selectedAssessmentId || undefined);

  // Fetch existing component marks
  const relevantMarkIds = useMemo(() => {
    if (!selectedSubjectId || !existingMarks.length) return [];
    return existingMarks
      .filter(m => m.subject_id === selectedSubjectId)
      .map(m => m.id);
  }, [existingMarks, selectedSubjectId]);

  const { data: existingComponentMarks = [] } = useComponentMarks(relevantMarkIds);

  // Unique classes / sections
  const uniqueClasses = useMemo(() => {
    const allClasses = sortClassNames([...new Set(students.map(s => s.class_name).filter(Boolean))] as string[]);
    // For teachers: only show classes from their assignments
    if (isTeacher && myClassAssignments.length > 0) {
      const assignedClassNames = new Set(myClassAssignments.map(a => a.class_name));
      return allClasses.filter(c => assignedClassNames.has(c));
    }
    return allClasses;
  }, [students, isTeacher, myClassAssignments]);

  const uniqueSections = useMemo(() => {
    if (!selectedClass) return [];
    return [...new Set(
      students
        .filter(s => s.class_name === selectedClass)
        .map(s => s.section)
        .filter(Boolean)
    )] as string[];
  }, [students, selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    return students.filter(s => s.class_name === selectedClass && s.section === selectedSection);
  }, [students, selectedClass, selectedSection]);

  // Reset dependent selections
  useEffect(() => {
    setSelectedSection("");
    setSelectedAssessmentId("");
    setSelectedSubjectId("");
    setLegacyMarks({});
    setComponentMarksInput({});
    setValidationErrors({});
  }, [selectedClass]);

  useEffect(() => {
    setLegacyMarks({});
    setComponentMarksInput({});
    setValidationErrors({});
  }, [selectedSection]);

  useEffect(() => {
    if (selectedSubjectId && subjects.length > 0) {
      const stillExists = subjects.some(s => s.id === selectedSubjectId);
      if (!stillExists) setSelectedSubjectId("");
    }
  }, [subjects, selectedSubjectId]);

  // Clear marks when assessment or subject selection changes
  const [loadedKey, setLoadedKey] = useState<string>("");

  useEffect(() => {
    setLegacyMarks({});
    setComponentMarksInput({});
    setValidationErrors({});
    setLoadedKey("");
  }, [selectedAssessmentId, selectedSubjectId]);

  // Populate from existing data (runs once per unique data load)
  useEffect(() => {
    if (!selectedAssessmentId || !selectedSubjectId || existingMarks.length === 0) return;

    const dataKey = `${selectedAssessmentId}_${selectedSubjectId}_${existingMarks.length}_${existingComponentMarks.length}`;
    if (dataKey === loadedKey) return;

    const subjectMarks = existingMarks.filter(m => m.subject_id === selectedSubjectId);
    if (subjectMarks.length === 0) return;

    if (hasTemplate && existingComponentMarks.length > 0) {
      const markByStudent = new Map<string, string>();
      subjectMarks.forEach(m => markByStudent.set(m.student_id, m.id));

      const newCM: ComponentMarksMap = {};
      for (const [studentId, markId] of markByStudent) {
        const cms = existingComponentMarks.filter(cm => cm.student_mark_id === markId);
        if (cms.length > 0) {
          newCM[studentId] = {};
          cms.forEach(cm => {
            newCM[studentId][cm.component_id] = cm.marks_obtained.toString();
          });
        }
      }
      setComponentMarksInput(newCM);
    } else {
      const newMarks: Record<string, { marksObtained: string; maxMarks: string }> = {};
      subjectMarks.forEach(m => {
        newMarks[m.student_id] = {
          marksObtained: m.marks_obtained.toString(),
          maxMarks: m.max_marks.toString(),
        };
      });
      setLegacyMarks(newMarks);
    }
    setLoadedKey(dataKey);
  }, [selectedAssessmentId, selectedSubjectId, existingMarks, existingComponentMarks, hasTemplate, loadedKey]);

  // Compute results for template mode
  const computedResults = useMemo(() => {
    if (!hasTemplate || templateComponents.length === 0) return {};
    const results: Record<string, ReturnType<typeof computeStudentResult>> = {};
    for (const student of filteredStudents) {
      const studentCM = componentMarksInput[student.id];
      if (!studentCM) continue;
      const inputs = templateComponents
        .filter(c => studentCM[c.id] !== undefined && studentCM[c.id] !== "")
        .map(c => ({ componentId: c.id, marksObtained: parseFloat(studentCM[c.id]) || 0 }));
      if (inputs.length > 0) {
        results[student.id] = computeStudentResult(inputs, templateComponents, gradeMappings);
      }
    }
    return results;
  }, [componentMarksInput, templateComponents, gradeMappings, filteredStudents, hasTemplate]);

  const handleComponentChange = (studentId: string, componentId: string, value: string, maxMarks: number) => {
    setHasUserEditedMarks(true);
    setComponentMarksInput(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [componentId]: value },
    }));

    const numVal = parseFloat(value);
    let error = "";
    if (value !== "" && !isNaN(numVal)) {
      if (numVal < 0) error = "Marks cannot be negative";
      else if (numVal > maxMarks) error = `Max allowed: ${maxMarks}`;
    }
    setValidationErrors(prev => {
      const studentErrors = { ...(prev[studentId] || {}) };
      if (error) studentErrors[componentId] = error;
      else delete studentErrors[componentId];
      return { ...prev, [studentId]: studentErrors };
    });
  };

  const handleLegacyChange = (studentId: string, field: "marksObtained" | "maxMarks", value: string) => {
    setHasUserEditedMarks(true);
    const currentMax = parseFloat(legacyMarks[studentId]?.maxMarks || defaultMaxMarks);
    setLegacyMarks(prev => ({
      ...prev,
      [studentId]: {
        marksObtained: field === "marksObtained" ? value : (prev[studentId]?.marksObtained || ""),
        maxMarks: field === "maxMarks" ? value : (prev[studentId]?.maxMarks || defaultMaxMarks),
      },
    }));
    if (field === "marksObtained") {
      const numVal = parseFloat(value);
      let error = "";
      if (value !== "" && !isNaN(numVal)) {
        if (numVal < 0) error = "Marks cannot be negative";
        else if (numVal > currentMax) error = `Max allowed: ${currentMax}`;
      }
      setValidationErrors(prev => {
        const studentErrors = { ...(prev[studentId] || {}) };
        if (error) studentErrors["legacy"] = error;
        else delete studentErrors["legacy"];
        return { ...prev, [studentId]: studentErrors };
      });
    }
  };

  // Auto-save: scope to the unique form context (year+class+section+assessment+subject)
  const autoSaveScopeKey = `${effectiveYearId}|${selectedClass}|${selectedSection}|${selectedAssessmentId}|${selectedSubjectId}`;
  const performSaveDraft = async (draft: MarksDraft) => {
    // Reuse the same logic as handleSave but driven by the draft snapshot.
    if (!selectedClass || !selectedSection || !selectedAssessmentId || !selectedSubjectId) return;
    if (draft.hasTemplate) {
      const marksToSave = filteredStudents
        .filter(s => {
          const cm = draft.componentMarksInput[s.id];
          return cm && Object.values(cm).some(v => v !== "" && !isNaN(parseFloat(v)));
        })
        .map(s => {
          const cm = draft.componentMarksInput[s.id] || {};
          const inputs = templateComponents
            .filter(c => cm[c.id] !== undefined && cm[c.id] !== "")
            .map(c => ({ componentId: c.id, marksObtained: parseFloat(cm[c.id]) || 0 }));
          const result = computeStudentResult(inputs, templateComponents, gradeMappings);
          return {
            student_id: s.id,
            assessment_id: selectedAssessmentId,
            subject_id: selectedSubjectId,
            marks_obtained: result?.total ?? 0,
            max_marks: result?.maxTotal ?? templateComponents.reduce((sum, c) => sum + Number(c.max_marks), 0),
            componentMarks: inputs.map(i => ({ component_id: i.componentId, marks_obtained: i.marksObtained })),
          };
        });
      if (marksToSave.length === 0) return;
      await saveMarks.mutateAsync({ marks: marksToSave, silent: true });
    } else {
      const marksToSave = Object.entries(draft.legacyMarks)
        .filter(([, m]) => m.marksObtained && !isNaN(parseFloat(m.marksObtained)))
        .map(([studentId, m]) => ({
          student_id: studentId,
          assessment_id: selectedAssessmentId,
          subject_id: selectedSubjectId,
          marks_obtained: parseFloat(m.marksObtained),
          max_marks: parseFloat(m.maxMarks) || 100,
        }));
      if (marksToSave.length === 0) return;
      await saveMarks.mutateAsync({ marks: marksToSave, silent: true });
    }
  };

  const autoSave = useAutoSave<MarksDraft>({
    namespace: "marks",
    scopeKey: autoSaveScopeKey,
    save: performSaveDraft,
    idleMs: MARKS_AUTO_SAVE_IDLE_MS,
  });

  const hasValidationErrors = Object.values(validationErrors).some(
    studentErrors => Object.keys(studentErrors).length > 0
  );

  // Mark dirty on every input change to either map.
  useEffect(() => {
    if (!selectedAssessmentId || !selectedSubjectId || !hasUserEditedMarks || hasValidationErrors) return;
    const hasInput = hasTemplate
      ? Object.values(componentMarksInput).some(cm => Object.values(cm).some(v => v !== ""))
      : Object.values(legacyMarks).some(m => m.marksObtained !== "");
    if (!hasInput) return;
    autoSave.markDirty({ hasTemplate, legacyMarks, componentMarksInput });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyMarks, componentMarksInput, hasTemplate, selectedAssessmentId, selectedSubjectId, hasUserEditedMarks, hasValidationErrors]);

  const handleSave = async () => {
    if (!selectedClass || !selectedSection || !selectedAssessmentId || !selectedSubjectId) {
      toast({ title: "Please complete all selections", variant: "destructive" });
      return;
    }

    if (hasTemplate) {
      // Template mode: build marks from component inputs
      const marksToSave = filteredStudents
        .filter(s => {
          const cm = componentMarksInput[s.id];
          return cm && Object.values(cm).some(v => v !== "" && !isNaN(parseFloat(v)));
        })
        .map(s => {
          const result = computedResults[s.id];
          const cm = componentMarksInput[s.id] || {};
          return {
            student_id: s.id,
            assessment_id: selectedAssessmentId,
            subject_id: selectedSubjectId,
            marks_obtained: result?.total ?? 0,
            max_marks: result?.maxTotal ?? templateComponents.reduce((sum, c) => sum + Number(c.max_marks), 0),
            componentMarks: templateComponents
              .filter(c => cm[c.id] !== undefined && cm[c.id] !== "")
              .map(c => ({ component_id: c.id, marks_obtained: parseFloat(cm[c.id]) || 0 })),
          };
        });

      if (marksToSave.length === 0) {
        toast({ title: "No marks to save", variant: "destructive" });
        return;
      }
      await saveMarks.mutateAsync(marksToSave);
      autoSave.markSaved();
    } else {
      // Legacy mode
      const marksToSave = Object.entries(legacyMarks)
        .filter(([, m]) => m.marksObtained && !isNaN(parseFloat(m.marksObtained)))
        .map(([studentId, m]) => ({
          student_id: studentId,
          assessment_id: selectedAssessmentId,
          subject_id: selectedSubjectId,
          marks_obtained: parseFloat(m.marksObtained),
          max_marks: parseFloat(m.maxMarks) || 100,
        }));

      if (marksToSave.length === 0) {
        toast({ title: "No marks to save", variant: "destructive" });
        return;
      }
      await saveMarks.mutateAsync(marksToSave);
      autoSave.markSaved();
    }
  };

  const formatSubjectLabel = (subject: { name: string; code: string | null }) => {
    return subject.code ? `${subject.name} (${subject.code})` : subject.name;
  };

  const hasAnyInput = hasTemplate
    ? Object.values(componentMarksInput).some(cm => Object.values(cm).some(v => v !== ""))
    : Object.values(legacyMarks).some(m => m.marksObtained !== "");

  const canSave = selectedClass && selectedSection && selectedAssessmentId && selectedSubjectId && hasAnyInput && !hasValidationErrors;

  const totalMaxMarks = templateComponents.reduce((sum, c) => sum + Number(c.max_marks), 0);

  return (
    <ProgressLayout>
      <PageHeader
        title="Marks Entry"
        description="Enter student marks for assessments"
      />

      <div className="mt-6">
        {/* Draft recovery */}
        {autoSave.pendingDraft && (
          <div className="mb-4">
            <DraftRecoveryBanner
              savedAt={autoSave.pendingDraft.savedAt}
              onRestore={() => {
                const draft = autoSave.restoreDraft();
                if (draft) {
                  setLegacyMarks(draft.data.legacyMarks);
                  setComponentMarksInput(draft.data.componentMarksInput);
                }
              }}
              onDismiss={autoSave.dismissDraft}
            />
          </div>
        )}

        {/* Template indicator */}
        {selectedClass && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {hasTemplate ? (
              <Badge variant="secondary" className="text-xs">
                📋 Template loaded — {templateComponents.length} component(s), max {totalMaxMarks} marks
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                No template assigned — using simple marks entry
              </Badge>
            )}
            <AutoSaveIndicator status={autoSave.status} lastSavedAt={autoSave.lastSavedAt} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={effectiveYearId || "none"} onValueChange={(v) => setSelectedYearId(v === "none" ? "" : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Academic Year" /></SelectTrigger>
            <SelectContent>
              {academicYears.length === 0 ? (
                <SelectItem value="none" disabled>No academic years</SelectItem>
              ) : academicYears.map(year => (
                <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass || "none"} onValueChange={(v) => setSelectedClass(v === "none" ? "" : v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              {uniqueClasses.length === 0 ? (
                <SelectItem value="none" disabled>No classes</SelectItem>
              ) : uniqueClasses.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSection || "none"} onValueChange={(v) => setSelectedSection(v === "none" ? "" : v)} disabled={!selectedClass || uniqueSections.length === 0}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              {uniqueSections.length === 0 ? (
                <SelectItem value="none" disabled>No sections</SelectItem>
              ) : uniqueSections.map(sec => (
                <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAssessmentId || "none"} onValueChange={(v) => setSelectedAssessmentId(v === "none" ? "" : v)} disabled={!selectedClass || assessments.length === 0}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select Assessment" /></SelectTrigger>
            <SelectContent>
              {assessments.length === 0 ? (
                <SelectItem value="none" disabled>No assessments</SelectItem>
              ) : assessments.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSubjectId || "none"} onValueChange={(v) => setSelectedSubjectId(v === "none" ? "" : v)} disabled={!selectedClass || isLoadingSubjects}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Subject" /></SelectTrigger>
            <SelectContent>
              {isLoadingSubjects ? (
                <SelectItem value="none" disabled>Loading...</SelectItem>
              ) : subjects.length === 0 ? (
                <SelectItem value="none" disabled>No subjects for this class</SelectItem>
              ) : subjects.map(s => (
                <SelectItem key={s.id} value={s.id}>{formatSubjectLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Max marks input only in legacy mode */}
          {!hasTemplate && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Max:</span>
              <Input type="number" value={defaultMaxMarks} onChange={(e) => setDefaultMaxMarks(e.target.value)} className="w-20" min="1" />
            </div>
          )}
        </div>

        <Card className="rounded-xl border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Enter Marks</CardTitle>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                  disabled={!selectedAssessmentId}
                  title={!selectedAssessmentId ? "Select an assessment first" : "Import marks from Excel, printed, or handwritten sheet"}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Marks
                </Button>
                <Button onClick={handleSave} disabled={!canSave || saveMarks.isPending}>
                  {saveMarks.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Marks
                </Button>
              </div>
              <LastSavedLabel lastSavedAt={autoSave.lastSavedAt} />
            </div>
          </CardHeader>
          <CardContent>
            {!selectedClass ? (
              <EmptyState icon={PenLine} title="Select a class" description="Choose a class to start entering marks." />
            ) : !selectedSection ? (
              <EmptyState icon={PenLine} title="Select a section" description="Choose a section to view students." />
            ) : filteredStudents.length === 0 ? (
              <EmptyState icon={PenLine} title="No students found" description="No students match the selected class and section." />
            ) : (() => {
              const readyForMarks = !!(selectedAssessmentId && selectedSubjectId);
              const showTemplateColumns = readyForMarks && hasTemplate && templateComponents.length > 0;
              const showLegacyColumns = readyForMarks && !hasTemplate;

              return (
                <div className="overflow-x-auto">
                  {!readyForMarks && (
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs">
                        Select an assessment and subject above to enter marks
                      </Badge>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10">Roll No</TableHead>
                        <TableHead className="sticky left-[60px] bg-background z-10">Student Name</TableHead>
                        {showTemplateColumns && (
                          <>
                            {templateComponents.map(c => (
                              <TableHead key={c.id} className="text-center min-w-[100px]">
                                {c.name}
                                <div className="text-xs font-normal text-muted-foreground">Max: {c.max_marks}</div>
                              </TableHead>
                            ))}
                            <TableHead className="text-center bg-muted/50">Total</TableHead>
                            <TableHead className="text-center bg-muted/50">%</TableHead>
                            <TableHead className="text-center bg-muted/50">Grade</TableHead>
                          </>
                        )}
                        {showLegacyColumns && (
                          <>
                            <TableHead className="w-[120px]">Marks Obtained</TableHead>
                            <TableHead className="w-[100px]">Max Marks</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map(student => {
                        const result = computedResults[student.id];
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="text-muted-foreground sticky left-0 bg-background">{student.roll_number || "-"}</TableCell>
                            <TableCell className="font-medium sticky left-[60px] bg-background">{student.name}</TableCell>
                            {showTemplateColumns && (
                              <>
                                {templateComponents.map(c => {
                                  const errorMsg = validationErrors[student.id]?.[c.id];
                                  return (
                                    <TableCell key={c.id}>
                                      <div>
                                        <Input
                                          type="number"
                                          value={componentMarksInput[student.id]?.[c.id] ?? ""}
                                          onChange={(e) => handleComponentChange(student.id, c.id, e.target.value, Number(c.max_marks))}
                                          placeholder="0"
                                          min="0"
                                          max={Number(c.max_marks)}
                                          className={`w-full text-center ${errorMsg ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        />
                                        {errorMsg && (
                                          <p className="text-xs text-destructive mt-1">{errorMsg}</p>
                                        )}
                                      </div>
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center font-semibold bg-muted/30">
                                  {result ? result.total : "–"}
                                </TableCell>
                                <TableCell className="text-center bg-muted/30">
                                  {result ? `${result.percentage}%` : "–"}
                                </TableCell>
                                <TableCell className="text-center bg-muted/30">
                                  {result?.grade ? (
                                    <Badge variant="secondary">{result.grade}</Badge>
                                  ) : "–"}
                                </TableCell>
                              </>
                            )}
                            {showLegacyColumns && (
                              <>
                                <TableCell>
                                  <div>
                                    <Input
                                      type="number"
                                      value={legacyMarks[student.id]?.marksObtained || ""}
                                      onChange={(e) => handleLegacyChange(student.id, "marksObtained", e.target.value)}
                                      placeholder="0"
                                      min="0"
                                      max={parseFloat(legacyMarks[student.id]?.maxMarks || defaultMaxMarks)}
                                      className={`w-full ${validationErrors[student.id]?.["legacy"] ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    />
                                    {validationErrors[student.id]?.["legacy"] && (
                                      <p className="text-xs text-destructive mt-1">{validationErrors[student.id]["legacy"]}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={legacyMarks[student.id]?.maxMarks || defaultMaxMarks}
                                    onChange={(e) => handleLegacyChange(student.id, "maxMarks", e.target.value)}
                                    min="1"
                                    className="w-full"
                                  />
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <MarksImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          assessmentId={selectedAssessmentId}
          knownStudents={filteredStudents.map(s => ({ id: s.id, name: s.name, roll_number: s.roll_number ?? null }))}
          knownSubjects={subjects.map(s => ({ id: s.id, name: s.name, code: s.code }))}
          assessmentMaxBySubject={subjects.reduce((acc, s) => {
            acc[s.id] = totalMaxMarks > 0 ? totalMaxMarks : 100;
            return acc;
          }, {} as Record<string, number>)}
        />

        {/* Competency Scoring Section */}
        {selectedSubjectId && selectedAssessmentId && filteredStudents.length > 0 && (
          <CompetencyScoring
            subjectId={selectedSubjectId}
            assessmentId={selectedAssessmentId}
            students={filteredStudents}
          />
        )}
      </div>
    </ProgressLayout>
  );
}
