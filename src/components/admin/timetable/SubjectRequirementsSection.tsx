import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Loader2, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { DELIVERY_MODES, PRIORITIES, REQUIREMENT_STATUS, WEEKDAYS } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import {
  useSubjectRequirements,
  useSubjectRequirementMutations,
  SubjectRequirement,
} from "@/hooks/timetable/useTimetableConfigData";
import {
  useEnrolledClassSections,
  useSchoolSubjects,
} from "@/hooks/timetable/useTimetableSourceData";
import { cn } from "@/lib/utils";

type Draft = Partial<SubjectRequirement>;

export function SubjectRequirementsSection() {
  const { schoolId, academicYearId, canEdit } = useTimetableConfig();
  const scope = { schoolId, academicYearId };
  const { data: classSections = [], isLoading: loadingClasses } = useEnrolledClassSections(academicYearId);
  const { data: subjectData, isLoading: loadingSubjects } = useSchoolSubjects(schoolId);
  const { data: requirements = [] } = useSubjectRequirements(scope);
  const { save, remove, initialize, bulkUpdate } = useSubjectRequirementMutations(scope);

  const [selected, setSelected] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [bulkPeriods, setBulkPeriods] = useState<string>("");

  const current = classSections.find((c) => c.label === selected) ?? classSections[0];

  const subjectsFor = (className: string) => {
    if (!subjectData) return [];
    const ids = subjectData.subjectIdsByClass.get(className) ?? [];
    return subjectData.subjects.filter((s) => ids.includes(s.id));
  };

  const subjects = useMemo(
    () => (current ? subjectsFor(current.class_name) : []),
    [subjectData, current]
  );

  /** Every valid class/section/subject combination derived from existing records. */
  const allCombos = useMemo(() => {
    const out: { class_name: string; section: string | null; subject_id: string }[] = [];
    for (const cs of classSections) {
      for (const s of subjectsFor(cs.class_name)) {
        out.push({ class_name: cs.class_name, section: cs.section, subject_id: s.id });
      }
    }
    return out;
  }, [classSections, subjectData]);

  const savedKeys = useMemo(
    () => new Set(requirements.map((r) => `${r.class_name}||${r.section ?? ""}||${r.subject_id}`)),
    [requirements]
  );
  const missingCount = allCombos.filter(
    (c) => !savedKeys.has(`${c.class_name}||${c.section ?? ""}||${c.subject_id}`)
  ).length;
  const draftCount = requirements.filter((r) => r.status === "draft").length;

  const existingFor = (subjectId: string) =>
    requirements.find(
      (r) =>
        r.subject_id === subjectId &&
        r.class_name === current?.class_name &&
        (r.section ?? null) === (current?.section ?? null)
    );

  const rowFor = (subjectId: string): Draft => {
    const key = `${current?.label}|${subjectId}`;
    if (drafts[key]) return drafts[key];
    const existing = existingFor(subjectId);
    return (
      existing ?? {
        subject_id: subjectId,
        class_name: current?.class_name,
        section: current?.section ?? null,
        periods_per_week: 1,
        delivery_mode: "theory",
        consecutive_periods: 1,
        priority: 2,
        status: "draft",
        preferred_weekdays: null,
        elective_group: null,
      }
    );
  };

  const patch = (subjectId: string, values: Draft) => {
    const key = `${current?.label}|${subjectId}`;
    setDrafts((prev) => ({ ...prev, [key]: { ...rowFor(subjectId), ...values } }));
  };

  const handleSave = (subjectId: string) => {
    const row = rowFor(subjectId);
    save.mutate(
      { ...row, class_name: current!.class_name, section: current?.section ?? null, subject_id: subjectId },
      {
        onSuccess: () =>
          setDrafts((prev) => {
            const copy = { ...prev };
            delete copy[`${current?.label}|${subjectId}`];
            return copy;
          }),
      }
    );
  };

  const classRequirementIds = requirements
    .filter(
      (r) => r.class_name === current?.class_name && (r.section ?? null) === (current?.section ?? null)
    )
    .map((r) => r.id);

  const applyBulkPeriods = () => {
    const value = Number(bulkPeriods);
    if (!value || value < 1) return;
    bulkUpdate.mutate(
      { ids: classRequirementIds, values: { periods_per_week: value, status: "active" } },
      { onSuccess: () => setDrafts({}) }
    );
  };

  if (loadingClasses || loadingSubjects) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (classSections.length === 0)
    return (
      <Card className="rounded-xl">
        <CardContent className="p-8 text-center">
          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No classes found for this academic year. Classes and sections come from your enrolled
            students.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-5">
      <Card className="rounded-xl border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Set up from your existing records
            </p>
            <p className="text-sm text-muted-foreground max-w-xl">
              Creates one row for every class, section and subject already in EdZen AI for this
              academic year. Rows you have already configured are kept exactly as they are.
            </p>
            <p className="text-xs text-muted-foreground">
              {missingCount > 0
                ? `${missingCount} combination${missingCount === 1 ? "" : "s"} not set up yet`
                : "All combinations are set up"}
              {draftCount > 0 && ` · ${draftCount} still need periods per week`}
            </p>
          </div>
          <Button
            onClick={() => initialize.mutate(allCombos)}
            disabled={!canEdit || initialize.isPending || missingCount === 0}
          >
            {initialize.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Initialize from existing school data
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Subject requirements</CardTitle>
          <CardDescription>
            How much of each subject a class needs per week. Subjects and classes shown here come from
            your existing records. Periods per week are your own choice — nothing is assumed from any
            board curriculum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Class &amp; section</Label>
              <Select value={current?.label ?? ""} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classSections.map((c) => (
                    <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Periods per week for every subject in this class</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 5"
                  className="max-w-[120px]"
                  value={bulkPeriods}
                  disabled={!canEdit}
                  onChange={(e) => setBulkPeriods(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={applyBulkPeriods}
                  disabled={
                    !canEdit ||
                    bulkUpdate.isPending ||
                    !bulkPeriods ||
                    classRequirementIds.length === 0
                  }
                >
                  {bulkUpdate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply to all {classRequirementIds.length || ""} subjects
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You can still change any single subject below afterwards.
              </p>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No subjects are assigned to {current?.class_name} yet. Assign subjects to this class
                first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject) => {
                const row = rowFor(subject.id);
                const saved = existingFor(subject.id);
                const dirty = !!drafts[`${current?.label}|${subject.id}`];
                return (
                  <div key={subject.id} className="rounded-xl border p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subject.name}</span>
                        <Badge variant="outline">{current?.label}</Badge>
                        <Badge variant="secondary" className="font-normal">Existing subject</Badge>
                        {saved && saved.status === "draft" && (
                          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                            Needs review
                          </Badge>
                        )}
                        {saved && saved.status !== "draft" && (
                          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                            Configured
                          </Badge>
                        )}
                      </div>
                      {saved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!canEdit}
                          onClick={() => remove.mutate(saved.id)}
                          aria-label="Remove requirement"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Periods per week</Label>
                        <Input
                          type="number"
                          min={1}
                          value={row.periods_per_week ?? 1}
                          disabled={!canEdit}
                          onChange={(e) => patch(subject.id, { periods_per_week: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery mode</Label>
                        <Select
                          value={row.delivery_mode ?? "theory"}
                          onValueChange={(v) => patch(subject.id, { delivery_mode: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DELIVERY_MODES.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Consecutive periods</Label>
                        <Input
                          type="number"
                          min={1}
                          value={row.consecutive_periods ?? 1}
                          disabled={!canEdit}
                          onChange={(e) => patch(subject.id, { consecutive_periods: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Elective group</Label>
                        <Input
                          placeholder="Optional"
                          value={row.elective_group ?? ""}
                          disabled={!canEdit}
                          onChange={(e) => patch(subject.id, { elective_group: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={String(row.priority ?? 2)}
                          onValueChange={(v) => patch(subject.id, { priority: Number(v) })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={row.status ?? "active"}
                          onValueChange={(v) => patch(subject.id, { status: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REQUIREMENT_STATUS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Preferred days</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {WEEKDAYS.map((d) => {
                            const on = (row.preferred_weekdays ?? []).includes(d.value);
                            return (
                              <button
                                key={d.value}
                                type="button"
                                disabled={!canEdit}
                                onClick={() => {
                                  const list = row.preferred_weekdays ?? [];
                                  patch(subject.id, {
                                    preferred_weekdays: on
                                      ? list.filter((x) => x !== d.value)
                                      : [...list, d.value].sort(),
                                  });
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg border text-xs",
                                  on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                                )}
                              >
                                {d.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSave(subject.id)}
                      disabled={!canEdit || save.isPending || (!dirty && !!saved)}
                    >
                      {save.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Update" : "Save"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
