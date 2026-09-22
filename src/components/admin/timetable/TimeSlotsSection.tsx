import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Save, Trash2, Wand2, Clock } from "lucide-react";
import { WEEKDAYS, addMinutes, toTimeInput, toTimeValue } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import {
  useTimetableSettings,
  useTimetableTimeSlots,
  useTimeSlotMutations,
  TimetableTimeSlot,
} from "@/hooks/timetable/useTimetableConfigData";
import { cn } from "@/lib/utils";

interface DraftSlot {
  id?: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export function TimeSlotsSection() {
  const { schoolId, academicYearId, canEdit } = useTimetableConfig();
  const scope = { schoolId, academicYearId };
  const { data: settings } = useTimetableSettings(scope);
  const { data: slots = [], isLoading } = useTimetableTimeSlots(scope);
  const { save, remove } = useTimeSlotMutations(scope);

  const [weekday, setWeekday] = useState(1);
  const [draft, setDraft] = useState<DraftSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const daySlots = useMemo(
    () => slots.filter((s) => s.weekday === weekday).sort((a, b) => a.period_number - b.period_number),
    [slots, weekday]
  );

  useEffect(() => {
    setDraft(
      daySlots.map((s: TimetableTimeSlot) => ({
        id: s.id,
        period_number: s.period_number,
        start_time: toTimeInput(s.start_time),
        end_time: toTimeInput(s.end_time),
        is_active: s.is_active,
      }))
    );
    setError(null);
  }, [daySlots]);

  const update = (index: number, patch: Partial<DraftSlot>) =>
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const addRow = () => {
    const last = draft[draft.length - 1];
    const start = last ? last.end_time : toTimeInput(settings?.day_start_time) || "08:00";
    setDraft((prev) => [
      ...prev,
      {
        period_number: (last?.period_number ?? 0) + 1,
        start_time: start,
        end_time: addMinutes(start, settings?.default_period_minutes ?? 45),
        is_active: true,
      },
    ]);
  };

  const generate = () => {
    const start = toTimeInput(settings?.day_start_time) || "08:00";
    const length = settings?.default_period_minutes ?? 45;
    const count = settings?.periods_per_day ?? 8;

    // breaks that apply to this weekday (specific day or "all working days"), in period order
    const dayBreaks = breaks
      .filter((b) => b.is_active && (b.weekday == null || b.weekday === weekday))
      .sort((a, b) => a.after_period - b.after_period);

    const rows: DraftSlot[] = [];
    let cursor = start;
    for (let i = 1; i <= count; i++) {
      const end = addMinutes(cursor, length);
      rows.push({ period_number: i, start_time: cursor, end_time: end, is_active: true });
      cursor = end;
      // push the next period forward by every break that falls after this period
      for (const b of dayBreaks.filter((b) => b.after_period === i)) {
        cursor = addMinutes(cursor, b.duration_minutes ?? 0);
      }
    }
    // keep ids of existing rows where the period number matches, so we update instead of duplicate
    setDraft(
      rows.map((r) => {
        const existing = draft.find((d) => d.period_number === r.period_number);
        return existing ? { ...r, id: existing.id } : r;
      })
    );
  };

  const validate = () => {
    const numbers = new Set<number>();
    for (const row of draft) {
      if (!row.start_time || !row.end_time) return "Every period needs a start and end time.";
      if (row.end_time <= row.start_time) return `Period ${row.period_number} ends before it starts.`;
      if (numbers.has(row.period_number)) return `Period number ${row.period_number} is used twice.`;
      numbers.add(row.period_number);
    }
    const sorted = [...draft].sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start_time < sorted[i - 1].end_time)
        return `Period ${sorted[i].period_number} overlaps period ${sorted[i - 1].period_number}.`;
    }
    return null;
  };

  const handleSave = () => {
    const msg = validate();
    setError(msg);
    if (msg) return;
    save.mutate(
      draft.map((row) => ({
        id: row.id,
        weekday,
        period_number: row.period_number,
        start_time: toTimeValue(row.start_time),
        end_time: toTimeValue(row.end_time),
        is_active: row.is_active,
      }))
    );
  };

  const handleRemove = (index: number) => {
    const row = draft[index];
    if (row.id) remove.mutate(row.id);
    else setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const workingDays = settings?.working_days ?? [1, 2, 3, 4, 5];

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Periods &amp; time slots</CardTitle>
        <CardDescription>
          Set the periods for each day separately. A day can have more or fewer periods than another.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setWeekday(d.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-sm transition-colors",
                weekday === d.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted",
                !workingDays.includes(d.value) && weekday !== d.value && "text-muted-foreground"
              )}
            >
              {d.short}
              {slots.some((s) => s.weekday === d.value) && (
                <span className="ml-1.5 text-xs opacity-70">
                  {slots.filter((s) => s.weekday === d.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {!workingDays.includes(weekday) && (
          <p className="text-sm text-muted-foreground">
            This day is not marked as a working day in General settings.
          </p>
        )}

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : draft.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No periods yet for {WEEKDAYS.find((d) => d.value === weekday)?.label}. Add one, or
              generate them from your general settings.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[80px_1fr_1fr_90px_44px] gap-3 px-1 text-xs text-muted-foreground">
              <span>Period</span>
              <span>Start</span>
              <span>End</span>
              <span>Active</span>
              <span />
            </div>
            {draft.map((row, i) => (
              <div
                key={row.id ?? `new-${i}`}
                className="grid grid-cols-2 sm:grid-cols-[80px_1fr_1fr_90px_44px] gap-3 items-center rounded-xl border p-3"
              >
                <Input
                  type="number"
                  min={1}
                  value={row.period_number}
                  disabled={!canEdit}
                  onChange={(e) => update(i, { period_number: Number(e.target.value) })}
                />
                <Input
                  type="time"
                  value={row.start_time}
                  disabled={!canEdit}
                  onChange={(e) => update(i, { start_time: e.target.value })}
                />
                <Input
                  type="time"
                  value={row.end_time}
                  disabled={!canEdit}
                  onChange={(e) => update(i, { end_time: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={row.is_active}
                    disabled={!canEdit}
                    onCheckedChange={(v) => update(i, { is_active: v })}
                  />
                  <span className="text-xs text-muted-foreground sm:hidden">Active</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canEdit}
                  onClick={() => handleRemove(i)}
                  aria-label="Remove period"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={addRow} disabled={!canEdit}>
            <Plus className="h-4 w-4 mr-2" /> Add period
          </Button>
          <Button variant="outline" onClick={generate} disabled={!canEdit}>
            <Wand2 className="h-4 w-4 mr-2" /> Generate from general settings
          </Button>
          <Button onClick={handleSave} disabled={!canEdit || save.isPending || draft.length === 0}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save {WEEKDAYS.find((d) => d.value === weekday)?.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
