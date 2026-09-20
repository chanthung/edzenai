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
import { Info, UserCheck } from "lucide-react";
import { WEEKDAYS, toTimeInput } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import {
  useTimetableTimeSlots,
  useTeacherAvailability,
  useAvailabilityMutations,
} from "@/hooks/timetable/useTimetableConfigData";
import { useActiveTeachers } from "@/hooks/timetable/useTimetableSourceData";
import { cn } from "@/lib/utils";

export function TeacherAvailabilitySection() {
  const { schoolId, academicYearId, canEdit } = useTimetableConfig();
  const scope = { schoolId, academicYearId };
  const { data: teachers = [], isLoading: loadingTeachers } = useActiveTeachers(schoolId);
  const { data: slots = [], isLoading: loadingSlots } = useTimetableTimeSlots(scope);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const { data: records = [] } = useTeacherAvailability(scope, teacherId);
  const { setSlot } = useAvailabilityMutations(scope, teacherId);
  const [reasonDraft, setReasonDraft] = useState<{ slotId: string; value: string } | null>(null);

  const bySlot = useMemo(() => {
    const map = new Map<string, { id: string; reason: string | null }>();
    for (const r of records) map.set(r.time_slot_id, { id: r.id, reason: r.reason });
    return map;
  }, [records]);

  const slotsByDay = useMemo(() => {
    const map = new Map<number, typeof slots>();
    for (const s of slots.filter((s) => s.is_active)) {
      const list = map.get(s.weekday) ?? [];
      list.push(s);
      map.set(s.weekday, list);
    }
    return map;
  }, [slots]);

  const toggle = (slotId: string) => {
    const existing = bySlot.get(slotId);
    setSlot.mutate({
      existingId: existing?.id,
      timeSlotId: slotId,
      isAvailable: !!existing, // currently unavailable -> make available
    });
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Teacher availability</CardTitle>
        <CardDescription>
          Teachers come from your existing staff records. By default everyone is available — mark
          only the periods a teacher cannot teach.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Reasons are visible to school administrators only. A teacher can see their own
            availability, never another teacher's.
          </span>
        </div>

        {loadingTeachers ? (
          <Skeleton className="h-10 w-72 rounded-lg" />
        ) : teachers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <UserCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No active teachers found. Add staff on the Teachers page first.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-w-sm">
            <Label>Teacher</Label>
            <Select value={teacherId ?? ""} onValueChange={setTeacherId}>
              <SelectTrigger><SelectValue placeholder="Select a teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.employee_id ? ` · ${t.employee_id}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {teacherId && (loadingSlots ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Set up periods first — availability is marked against your time slots.
          </p>
        ) : (
          <div className="space-y-4">
            {WEEKDAYS.filter((d) => slotsByDay.has(d.value)).map((d) => (
              <div key={d.value} className="space-y-2">
                <p className="text-sm font-medium">{d.label}</p>
                <div className="flex flex-wrap gap-2">
                  {(slotsByDay.get(d.value) ?? []).map((s) => {
                    const unavailable = bySlot.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggle(s.id)}
                        title={bySlot.get(s.id)?.reason ?? undefined}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                          unavailable
                            ? "bg-destructive/10 border-destructive/40 text-destructive"
                            : "bg-background hover:bg-muted",
                          !canEdit && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <span className="block font-medium">Period {s.period_number}</span>
                        <span className="block opacity-80">
                          {toTimeInput(s.start_time)}–{toTimeInput(s.end_time)}
                        </span>
                        <span className="block mt-1">{unavailable ? "Unavailable" : "Available"}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(slotsByDay.get(d.value) ?? [])
                    .filter((s) => bySlot.has(s.id))
                    .map((s) => {
                      const rec = bySlot.get(s.id)!;
                      const editing = reasonDraft?.slotId === s.id;
                      return (
                        <div key={`r-${s.id}`} className="flex items-center gap-2">
                          <Badge variant="outline">P{s.period_number}</Badge>
                          {editing ? (
                            <>
                              <Input
                                className="h-8 w-56"
                                placeholder="Reason (optional)"
                                value={reasonDraft.value}
                                onChange={(e) => setReasonDraft({ slotId: s.id, value: e.target.value })}
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSlot.mutate({
                                    existingId: rec.id,
                                    timeSlotId: s.id,
                                    isAvailable: false,
                                    reason: reasonDraft.value,
                                  });
                                  setReasonDraft(null);
                                }}
                              >
                                Save
                              </Button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={!canEdit}
                              className="text-xs text-muted-foreground underline underline-offset-2"
                              onClick={() => setReasonDraft({ slotId: s.id, value: rec.reason ?? "" })}
                            >
                              {rec.reason ? rec.reason : "Add reason"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
