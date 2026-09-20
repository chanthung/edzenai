import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save } from "lucide-react";
import { WEEKDAYS, toTimeInput, toTimeValue } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import { useTimetableSettings, useSaveTimetableSettings } from "@/hooks/timetable/useTimetableConfigData";
import { cn } from "@/lib/utils";

export function GeneralSection() {
  const { schoolId, academicYearId, canEdit } = useTimetableConfig();
  const scope = { schoolId, academicYearId };
  const { data: settings, isLoading } = useTimetableSettings(scope);
  const saveSettings = useSaveTimetableSettings(scope);

  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("08:00");
  const [periodMinutes, setPeriodMinutes] = useState(45);
  const [periodsPerDay, setPeriodsPerDay] = useState(8);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setWorkingDays(settings.working_days ?? [1, 2, 3, 4, 5]);
      setStartTime(toTimeInput(settings.day_start_time) || "08:00");
      setPeriodMinutes(settings.default_period_minutes);
      setPeriodsPerDay(settings.periods_per_day);
    }
  }, [settings]);

  const toggleDay = (day: number) =>
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );

  const handleSave = () => {
    if (workingDays.length === 0) return setError("Select at least one working day.");
    if (!startTime) return setError("Enter the school start time.");
    if (periodMinutes < 5 || periodMinutes > 240) return setError("Period length must be between 5 and 240 minutes.");
    if (periodsPerDay < 1 || periodsPerDay > 20) return setError("Periods per day must be between 1 and 20.");
    setError(null);
    saveSettings.mutate({
      working_days: workingDays,
      day_start_time: toTimeValue(startTime),
      default_period_minutes: periodMinutes,
      periods_per_day: periodsPerDay,
      is_active: true,
    });
  };

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>General settings</CardTitle>
        <CardDescription>
          The basics of your school day for the selected academic year. These values are used as
          defaults when you set up periods.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Working days</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                disabled={!canEdit}
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm transition-colors",
                  workingDays.includes(d.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted",
                  !canEdit && "opacity-60 cursor-not-allowed"
                )}
              >
                {d.short}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tt-start">School start time</Label>
            <Input
              id="tt-start"
              type="time"
              value={startTime}
              disabled={!canEdit}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tt-duration">Default period length (minutes)</Label>
            <Input
              id="tt-duration"
              type="number"
              min={5}
              max={240}
              value={periodMinutes}
              disabled={!canEdit}
              onChange={(e) => setPeriodMinutes(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tt-periods">Periods per day</Label>
            <Input
              id="tt-periods"
              type="number"
              min={1}
              max={20}
              value={periodsPerDay}
              disabled={!canEdit}
              onChange={(e) => setPeriodsPerDay(Number(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSave} disabled={!canEdit || saveSettings.isPending}>
          {saveSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
}
