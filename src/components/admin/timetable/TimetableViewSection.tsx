import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarX2 } from "lucide-react";
import { useTimetableConfig } from "./TimetableConfigContext";
import { useTimetableView, type ViewEntry } from "@/hooks/timetable/useTimetableView";
import { useTimetableBreaks } from "@/hooks/timetable/useTimetableConfigData";
import { BREAK_TYPES, WEEKDAYS, labelOf, toTimeInput } from "./constants";

type Mode = "class" | "teacher" | "room";
const DAYS = WEEKDAYS.slice(0, 5);

function Empty({ text }: { text: string }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-8 text-center">
        <CalendarX2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

export function TimetableViewSection() {
  const { schoolId, academicYearId } = useTimetableConfig();
  const { data, isLoading, error } = useTimetableView(schoolId, academicYearId);
  const { data: breaks = [] } = useTimetableBreaks({ schoolId, academicYearId });
  const [mode, setMode] = useState<Mode>("class");
  const [classKey, setClassKey] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");

  const entries = data && data.run ? data.entries : [];

  const classOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries) {
      const key = `${e.class_name}||${e.section ?? ""}`;
      if (!m.has(key)) m.set(key, e.section ? `${e.class_name} - ${e.section}` : e.class_name);
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }));
  }, [entries]);

  const teacherOptions = useMemo(() => {
    if (!data?.run) return [];
    const ids = new Set(entries.map((e) => e.teacher_id).filter(Boolean) as string[]);
    return [...ids].map((id) => [id, data.teachers.get(id) ?? "Unknown teacher"] as const)
      .sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries, data]);

  const roomOptions = useMemo(() => {
    if (!data?.run) return [];
    const ids = new Set(entries.map((e) => e.room_id).filter(Boolean) as string[]);
    return [...ids].map((id) => [id, data.rooms.get(id) ?? "Unknown room"] as const)
      .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }));
  }, [entries, data]);

  useEffect(() => {
    if (!classKey && classOptions[0]) setClassKey(classOptions[0][0]);
    if (!teacherId && teacherOptions[0]) setTeacherId(teacherOptions[0][0]);
    if (!roomId && roomOptions[0]) setRoomId(roomOptions[0][0]);
  }, [classOptions, teacherOptions, roomOptions, classKey, teacherId, roomId]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (error) return <Empty text="Could not load the timetable. Please try again." />;
  if (!data?.run) return <Empty text="No generated timetable is available for this academic year." />;
  if (entries.length === 0) return <Empty text="This timetable run contains no timetable entries." />;

  const filtered: ViewEntry[] = entries.filter((e) => {
    if (mode === "class") return `${e.class_name}||${e.section ?? ""}` === classKey;
    if (mode === "teacher") return e.teacher_id === teacherId;
    return e.room_id === roomId;
  });

  const slotById = new Map(data.slots.map((s) => [s.id, s]));
  const cell = new Map<string, ViewEntry[]>();
  for (const e of filtered) {
    const s = slotById.get(e.time_slot_id);
    if (!s) continue;
    const k = `${s.weekday}|${s.period_number}`;
    cell.set(k, [...(cell.get(k) ?? []), e]);
  }
  const slotAt = new Map(data.slots.map((s) => [`${s.weekday}|${s.period_number}`, s]));
  const periods = [...new Set(data.slots.filter((s) => s.weekday <= 5).map((s) => s.period_number))].sort((a, b) => a - b);
  const activeBreaks = breaks.filter((b: any) => b.is_active !== false);

  const options = mode === "class" ? classOptions : mode === "teacher" ? teacherOptions : roomOptions;
  const value = mode === "class" ? classKey : mode === "teacher" ? teacherId : roomId;
  const setValue = mode === "class" ? setClassKey : mode === "teacher" ? setTeacherId : setRoomId;

  return (
    <div className="space-y-4">
      <Card className="rounded-xl">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="class">Class Timetable</TabsTrigger>
              <TabsTrigger value="teacher">Teacher Timetable</TabsTrigger>
              <TabsTrigger value="room">Room Timetable</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-2 w-full sm:w-64">
            <Label>{mode === "class" ? "Class & section" : mode === "teacher" ? "Teacher" : "Room"}</Label>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">None in this timetable.</p>
            ) : (
              <Select value={value || undefined} onValueChange={setValue}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {options.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <Badge variant="secondary" className="font-normal capitalize ml-auto">Run: {data.run.status}</Badge>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Empty text="No periods for this selection." />
      ) : (
        <Card className="rounded-xl overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left font-medium w-28">Period</th>
                {DAYS.map((d) => <th key={d.value} className="p-3 text-left font-medium">{d.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const rowBreaks = activeBreaks.filter((b: any) => b.after_period === p);
                return [
                  <tr key={`p${p}`} className="border-t border-border">
                    <td className="p-3 align-top font-medium">Period {p}</td>
                    {DAYS.map((d) => {
                      const s = slotAt.get(`${d.value}|${p}`);
                      const items = cell.get(`${d.value}|${p}`) ?? [];
                      return (
                        <td key={d.value} className="p-2 align-top">
                          {s && <div className="text-xs text-muted-foreground mb-1">{toTimeInput(s.start_time)}–{toTimeInput(s.end_time)}</div>}
                          {items.map((e) => (
                            <div key={e.id} className="rounded-lg bg-primary/10 p-2 mb-1">
                              <div className="font-medium">{data.subjects.get(e.subject_id) ?? "Subject"}</div>
                              {mode !== "class" && (
                                <div className="text-xs text-muted-foreground">{e.section ? `${e.class_name} - ${e.section}` : e.class_name}</div>
                              )}
                              {e.teacher_id && data.teachers.get(e.teacher_id) && (
                                <div className="text-xs">{data.teachers.get(e.teacher_id)}</div>
                              )}
                              {e.room_id && data.rooms.get(e.room_id) && (
                                <div className="text-xs text-muted-foreground">{data.rooms.get(e.room_id)}</div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>,
                  rowBreaks.length > 0 && (
                    <tr key={`b${p}`} className="border-t border-border bg-muted/30">
                      <td className="p-2 text-xs font-medium text-muted-foreground">Break</td>
                      {DAYS.map((d) => {
                        const bs = rowBreaks.filter((b: any) => b.weekday == null || b.weekday === d.value);
                        return (
                          <td key={d.value} className="p-2 text-xs text-muted-foreground">
                            {bs.map((b: any) => (
                              <div key={b.id}>{labelOf(BREAK_TYPES, b.break_type)} · {b.duration_minutes} min</div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
