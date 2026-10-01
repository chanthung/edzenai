import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CalendarX2, Printer, Settings2, Coffee, UtensilsCrossed, Clock } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useTimetableView, type ViewEntry } from "@/hooks/timetable/useTimetableView";
import { useTimetableBreaks, useTimetableRooms } from "@/hooks/timetable/useTimetableConfigData";
import { useActiveTeachers } from "@/hooks/timetable/useTimetableSourceData";
import { BREAK_TYPES, WEEKDAYS, labelOf, toTimeInput } from "../constants";
import { DISCIPLINES, disciplineOf, meta, type DisciplineKey } from "./disciplines";
import { cn } from "@/lib/utils";

const DAYS = WEEKDAYS.slice(0, 5);
type Mode = "class" | "teacher";

function Empty({ text, action }: { text: string; action?: boolean }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-10 text-center">
        <CalendarX2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">{text}</p>
        {action && (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/admin/settings?tab=timetable">
              <Settings2 className="h-4 w-4 mr-2" />
              Open timetable settings
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const minutesOf = (t?: string | null) => {
  if (!t) return -1;
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
};

export function TimetableDashboardTab() {
  const { data: school } = useSchool();
  const { data: years = [] } = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const selectedYear = yearId ?? years.find((y) => y.is_active)?.id ?? years[0]?.id ?? null;
  const schoolId = school?.id ?? null;

  const { data, isLoading, error } = useTimetableView(schoolId, selectedYear);
  const { data: breaks = [] } = useTimetableBreaks({ schoolId, academicYearId: selectedYear });
  const { data: allTeachers = [] } = useActiveTeachers(schoolId);
  const { data: allRooms = [] } = useTimetableRooms(schoolId);

  const [mode, setMode] = useState<Mode>("class");
  const [classKey, setClassKey] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [filter, setFilter] = useState<DisciplineKey | "all">("all");
  const [detail, setDetail] = useState<ViewEntry | null>(null);

  const entries = data && data.run ? data.entries : [];

  const classOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries) {
      const key = `${e.class_name}||${e.section ?? ""}`;
      if (!m.has(key)) m.set(key, e.section ? `${e.class_name} - ${e.section}` : e.class_name);
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }));
  }, [entries]);

  const teacherOptions = useMemo(
    () => allTeachers.map((t) => [t.id, t.name] as const).sort((a, b) => a[1].localeCompare(b[1])),
    [allTeachers]
  );

  useEffect(() => {
    if (!classKey && classOptions[0]) setClassKey(classOptions[0][0]);
    if (!teacherId && teacherOptions[0]) setTeacherId(teacherOptions[0][0]);
  }, [classOptions, teacherOptions, classKey, teacherId]);

  const now = new Date();
  const todayWeekday = now.getDay() === 0 ? 7 : now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (years.length === 0) return <Empty text="Create an academic year first to see a timetable." />;
  if (isLoading) return <Skeleton className="h-[480px] w-full rounded-xl" />;
  if (error) return <Empty text="Could not load the timetable. Please try again." />;
  if (!data?.run) return <Empty text="No generated timetable is available for this academic year." action />;
  if (entries.length === 0) return <Empty text="This timetable contains no periods yet." action />;

  const filtered = entries.filter((e) =>
    mode === "class" ? `${e.class_name}||${e.section ?? ""}` === classKey : e.teacher_id === teacherId
  );

  const slotById = new Map(data.slots.map((s) => [s.id, s]));
  const slotAt = new Map(data.slots.map((s) => [`${s.weekday}|${s.period_number}`, s]));
  const cell = new Map<string, ViewEntry[]>();
  for (const e of filtered) {
    const s = slotById.get(e.time_slot_id);
    if (!s) continue;
    const k = `${s.weekday}|${s.period_number}`;
    cell.set(k, [...(cell.get(k) ?? []), e]);
  }
  const periods = [...new Set(data.slots.filter((s) => s.weekday <= 5).map((s) => s.period_number))].sort((a, b) => a - b);
  const activeBreaks = breaks.filter((b: any) => b.is_active !== false);
  const roomName = (id: string | null) => (id ? data.rooms.get(id) ?? null : null);

  // Curricular balance for the current selection
  const balance = DISCIPLINES.map((d) => ({
    ...d,
    count: filtered.filter((e) => disciplineOf(data.subjects.get(e.subject_id) ?? "") === d.key).length,
  })).filter((d) => d.count > 0);
  const totalPeriods = filtered.length;

  const renderCard = (e: ViewEntry, compact = false) => {
    const subject = data.subjects.get(e.subject_id) ?? "Subject";
    const d = meta(disciplineOf(subject));
    const s = slotById.get(e.time_slot_id);
    const isNow =
      !!s && s.weekday === todayWeekday && nowMinutes >= minutesOf(s.start_time) && nowMinutes < minutesOf(s.end_time);
    const dim = filter !== "all" && d.key !== filter;
    return (
      <button
        key={e.id}
        type="button"
        onClick={() => setDetail(e)}
        className={cn(
          "relative w-full text-left min-h-[44px] rounded-lg border border-border bg-card p-3 pl-4 shadow-sm transition-all",
          "hover:shadow-md hover:-translate-y-0.5",
          isNow && "bg-primary/5 border-primary/30 shadow-md",
          dim && "opacity-20 grayscale scale-[0.98] hover:translate-y-0 hover:shadow-sm"
        )}
      >
        <span className={cn("absolute left-0 top-0 bottom-0 rounded-l-lg", d.stripe, isNow ? "w-2" : "w-1.5")} />
        <div className="flex items-center justify-between gap-1">
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider", isNow ? "bg-primary text-primary-foreground" : d.chip)}>
            {isNow ? "Active session" : d.short}
          </span>
          {roomName(e.room_id) && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-medium text-muted-foreground truncate max-w-[70px]">
              {roomName(e.room_id)}
            </span>
          )}
        </div>
        <p className={cn("mt-1.5 font-bold leading-tight text-foreground", compact ? "text-[13px]" : "text-[15px]")}>{subject}</p>
        <p className="text-xs text-muted-foreground truncate">
          {mode === "class"
            ? (e.teacher_id && data.teachers.get(e.teacher_id)) || "Unassigned"
            : e.section
              ? `${e.class_name} - ${e.section}`
              : e.class_name}
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="rounded-xl print:hidden">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="class">By Class</TabsTrigger>
              <TabsTrigger value="teacher">By Teacher</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2 w-full sm:w-56">
            <Label>{mode === "class" ? "Class & section" : "Teacher"}</Label>
            {(mode === "class" ? classOptions : teacherOptions).length === 0 ? (
              <p className="text-sm text-muted-foreground">{mode === "class" ? "No classes in this timetable." : "No active teachers found."}</p>
            ) : (
              <Select
                value={(mode === "class" ? classKey : teacherId) || undefined}
                onValueChange={mode === "class" ? setClassKey : setTeacherId}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(mode === "class" ? classOptions : teacherOptions).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2 w-full sm:w-48">
            <Label>Academic year</Label>
            <Select value={selectedYear ?? undefined} onValueChange={setYearId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.name}{y.is_active ? " (current)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="font-normal capitalize">Run: {data.run.status}</Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discipline filter chips */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
            filter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-muted/70"
          )}
        >
          All disciplines
        </button>
        {DISCIPLINES.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setFilter(d.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5",
              filter === d.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-muted/70"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", d.dot)} />
            {d.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty text="No periods for this selection." />
      ) : (
        <>
          <Card className="rounded-xl overflow-x-auto">
            <div className="min-w-[760px] p-3">
              {/* Day header */}
              <div className="grid grid-cols-[100px_repeat(5,minmax(0,1fr))] gap-2 sticky top-0 z-10 bg-card pb-2">
                <div />
                {DAYS.map((d) => {
                  const isToday = d.value === todayWeekday;
                  return (
                    <div
                      key={d.value}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-bold flex items-center justify-between",
                        isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      )}
                    >
                      <span>{d.label}</span>
                      {isToday && <span className="text-[10px] uppercase tracking-wider font-semibold">Today</span>}
                    </div>
                  );
                })}
              </div>

              {periods.map((p) => {
                const rowBreaks = activeBreaks.filter((b: any) => b.after_period === p);
                return (
                  <div key={p}>
                    <div className="grid grid-cols-[100px_repeat(5,minmax(0,1fr))] gap-2 mb-2">
                      <div className="sticky left-0 rounded-lg bg-muted/60 px-2 py-3 text-center">
                        <p className="text-[11px] font-semibold text-foreground">Period {p}</p>
                        {(() => {
                          const s = slotAt.get(`1|${p}`) ?? slotAt.get(`${DAYS[0].value}|${p}`);
                          return s ? (
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              {toTimeInput(s.start_time)}–{toTimeInput(s.end_time)}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      {DAYS.map((d) => {
                        const items = cell.get(`${d.value}|${p}`) ?? [];
                        return (
                          <div key={d.value} className="space-y-2">
                            {items.length === 0 ? (
                              <div className="min-h-[72px] rounded-lg border border-dashed border-border" />
                            ) : (
                              items.map((e) => renderCard(e))
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {rowBreaks.length > 0 && (
                      <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-2 mb-2">
                        <div className="rounded-lg bg-muted/40 px-2 py-2 text-center text-[11px] font-semibold text-muted-foreground">
                          Break
                        </div>
                        <div className="rounded-lg bg-muted/40 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                          {rowBreaks.map((b: any) => {
                            const isLunch = String(b.break_type).toLowerCase().includes("lunch");
                            const Icon = isLunch ? UtensilsCrossed : Coffee;
                            return (
                              <span key={b.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Icon className="h-3.5 w-3.5" />
                                <span className="font-semibold text-foreground">{labelOf(BREAK_TYPES, b.break_type)}</span>
                                <span className="tabular-nums">{b.duration_minutes} mins</span>
                                {b.weekday != null && (
                                  <span>· {WEEKDAYS.find((w) => w.value === b.weekday)?.label}</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Curricular balance */}
          <Card className="rounded-xl print:hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Curricular balance · {totalPeriods} periods a week</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {balance.map((d) => (
                  <div key={d.key} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", d.dot)} />
                      <p className="text-xs text-muted-foreground">{d.label}</p>
                    </div>
                    <p className="mt-1 text-xl font-bold tabular-nums">{d.count}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {Math.round((d.count / totalPeriods) * 100)}% of the week
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          {detail && (() => {
            const s = slotById.get(detail.time_slot_id);
            const subject = data.subjects.get(detail.subject_id) ?? "Subject";
            return (
              <>
                <SheetHeader className="text-left">
                  <SheetTitle>{subject}</SheetTitle>
                </SheetHeader>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Class: </span>{detail.section ? `${detail.class_name} - ${detail.section}` : detail.class_name}</p>
                  <p><span className="text-muted-foreground">Teacher: </span>{(detail.teacher_id && data.teachers.get(detail.teacher_id)) || "Unassigned"}</p>
                  <p><span className="text-muted-foreground">Room: </span>{roomName(detail.room_id) || "Not set"}</p>
                  {s && (
                    <p>
                      <span className="text-muted-foreground">Time: </span>
                      {WEEKDAYS.find((w) => w.value === s.weekday)?.label}, {toTimeInput(s.start_time)}–{toTimeInput(s.end_time)} (Period {s.period_number})
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
