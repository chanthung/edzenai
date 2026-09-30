import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { useAcademicYears, useCurrentAcademicYearContext } from "@/hooks/useAcademicYears";
import { useSubjectsWithClasses } from "@/hooks/progress/useSubjects";
import { useSchoolTeachingAssignments } from "@/hooks/useTeachingAssignments";
import type { Teacher } from "@/hooks/useTeachers";
import { sortClassNames } from "@/lib/class-sort";
import { cn } from "@/lib/utils";
import { AssignTeachersPopover } from "./AssignTeachersPopover";
import { TeacherSummaryPopover } from "./TeacherSummaryPopover";

export function TeachingAssignmentsMatrix({ teachers, canEdit, onEditTeacher }: { teachers: Teacher[]; canEdit: boolean; onEditTeacher?: (t: Teacher) => void }) {
  const { data: years = [] } = useAcademicYears();
  const current = useCurrentAcademicYearContext();
  const [yearId, setYearId] = useState<string | null>(null);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const selectedYear = yearId ?? current.academic_year_id ?? years[0]?.id ?? null;

  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsWithClasses();
  const { data: assignments = [], isLoading: loadingAssignments } = useSchoolTeachingAssignments(selectedYear);

  const teacherById = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const subjectIndex = useMemo(() => new Map(subjects.map((s, i) => [s.id, { name: s.name, i }])), [subjects]);
  const subjectName = (id: string) => subjectIndex.get(id)?.name ?? "Unknown subject";
  const subjectOrder = (id: string) => subjectIndex.get(id)?.i ?? 9999;
  const cellMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of assignments) {
      const k = `${a.subject_id}::${a.class_name}`;
      m.set(k, [...(m.get(k) ?? []), a.teacher_id]);
    }
    return m;
  }, [assignments]);

  // Same subject/class universe as Edit Teacher: subjects × their subject_class_assignments classes.
  const applicable = subjects.filter(s => s.assigned_classes.length > 0);
  const columns = useMemo(() => sortClassNames([...new Set(applicable.flatMap(s => s.assigned_classes))]), [applicable]);
  const total = applicable.reduce((n, s) => n + s.assigned_classes.length, 0);
  const covered = applicable.reduce((n, s) => n + s.assigned_classes.filter(c => cellMap.has(`${s.id}::${c}`)).length, 0);

  const rows = applicable
    .filter(s => subjectFilter === "all" || s.id === subjectFilter)
    .filter(s => !onlyUnassigned || s.assigned_classes.some(c => !cellMap.has(`${s.id}::${c}`)));

  const loading = loadingSubjects || loadingAssignments || current.isLoading;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle>Teaching Assignments</CardTitle>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 w-full sm:w-52">
            <Label className="text-xs">Academic Year</Label>
            <Select value={selectedYear ?? undefined} onValueChange={setYearId}>
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.id} value={y.id}>{y.name}{y.id === current.academic_year_id ? " (Current)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full sm:w-52">
            <Label className="text-xs">Subject</Label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {applicable.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm cursor-pointer">
            <Switch checked={onlyUnassigned} onCheckedChange={setOnlyUnassigned} />
            Show unassigned only
          </label>
        </div>
        {!loading && total > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{covered} of {total}</span> subject–class combinations assigned
            {total - covered > 0 && <> · <span className="text-amber-700">{total - covered} need a teacher</span></>}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Assignments apply to a whole class (all its sections).</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : !selectedYear ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Create an academic year first.</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No subject–class combinations available.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {onlyUnassigned ? "Every subject–class combination has a teacher." : "No subject–class combinations available."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted text-left font-medium px-3 py-2 min-w-[140px] border-r">Subject</th>
                  {columns.map(c => <th key={c} className="px-3 py-2 font-medium text-left whitespace-nowrap min-w-[130px]">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium border-r">{s.name}</td>
                    {columns.map(c => {
                      if (!s.assigned_classes.includes(c)) return <td key={c} className="px-3 py-2 bg-muted/20" />;
                      const ids = cellMap.get(`${s.id}::${c}`) ?? [];
                      if (onlyUnassigned && ids.length > 0) return <td key={c} className="px-3 py-2" />;
                      if (ids.length > 0) {
                        return (
                          <td key={c} className="px-3 py-2 align-top">
                            <div className="flex items-start gap-1">
                              <div className="flex flex-col gap-0.5 text-left">
                                {ids.map(id => {
                                  const t = teacherById.get(id);
                                  const label = <span className={cn("text-sm", t && !t.is_active && "text-muted-foreground line-through")}>{t?.name ?? "Unknown"}</span>;
                                  return t ? (
                                    <TeacherSummaryPopover
                                      key={id} teacher={t} assignments={assignments}
                                      subjectName={subjectName} subjectOrder={subjectOrder}
                                      onEdit={canEdit ? onEditTeacher : undefined}
                                      trigger={<button type="button" className="rounded px-1 text-left hover:bg-muted/60 hover:underline">{label}</button>}
                                    />
                                  ) : <span key={id} className="px-1">{label}</span>;
                                })}
                              </div>
                              {canEdit && (
                                <AssignTeachersPopover
                                  subjectId={s.id} subjectName={s.name} className={c}
                                  academicYearId={selectedYear} teachers={teachers} assignments={assignments}
                                  trigger={<button type="button" aria-label="Change teachers" title="Change teachers" className="rounded p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"><Pencil className="h-3 w-3" /></button>}
                                />
                              )}
                            </div>
                          </td>
                        );
                      }
                      const content = (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                          <Plus className="h-3 w-3" />Assign
                        </span>
                      );
                      return (
                        <td key={c} className="px-3 py-2 align-top">
                          {canEdit ? (
                            <AssignTeachersPopover
                              subjectId={s.id} subjectName={s.name} className={c}
                              academicYearId={selectedYear} teachers={teachers} assignments={assignments}
                              trigger={<button type="button" className="rounded-md px-1 py-0.5 hover:bg-muted/60 text-left">{content}</button>}
                            />
                          ) : <span className="text-xs text-amber-700">Unassigned</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
