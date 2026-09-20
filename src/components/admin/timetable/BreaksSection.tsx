import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coffee, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { BREAK_TYPES, WEEKDAYS, labelOf, weekdayLabel } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import {
  useTimetableBreaks,
  useBreakMutations,
  TimetableBreak,
} from "@/hooks/timetable/useTimetableConfigData";

type Draft = Partial<TimetableBreak>;

export function BreaksSection() {
  const { schoolId, academicYearId, canEdit } = useTimetableConfig();
  const scope = { schoolId, academicYearId };
  const { data: breaks = [], isLoading } = useTimetableBreaks(scope);
  const { save, remove } = useBreakMutations(scope);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startNew = () =>
    setDraft({ break_type: "short_break", weekday: null, after_period: 1, duration_minutes: 15, is_active: true });

  const handleSave = () => {
    if (!draft) return;
    if (!draft.after_period || draft.after_period < 0) return setError("Enter the period this break follows.");
    if (!draft.duration_minutes || draft.duration_minutes <= 0) return setError("Enter a duration in minutes.");
    setError(null);
    save.mutate(draft, { onSuccess: () => setDraft(null) });
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Breaks</CardTitle>
        <CardDescription>
          Assembly, prayer, short breaks and lunch. These are not teaching periods — no class is
          scheduled during them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : breaks.length === 0 && !draft ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Coffee className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No breaks configured for this year yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {breaks.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{labelOf(BREAK_TYPES, b.break_type)}</span>
                    {!b.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {weekdayLabel(b.weekday)} · after period {b.after_period} · {b.duration_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled={!canEdit} onClick={() => setDraft(b)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canEdit}
                    onClick={() => remove.mutate(b.id)}
                    aria-label="Remove break"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {draft && (
          <div className="rounded-xl border p-4 space-y-4 bg-muted/30">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={draft.break_type}
                  onValueChange={(v) => setDraft({ ...draft, break_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BREAK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Applies to</Label>
                <Select
                  value={draft.weekday ? String(draft.weekday) : "all"}
                  onValueChange={(v) => setDraft({ ...draft, weekday: v === "all" ? null : Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All working days</SelectItem>
                    {WEEKDAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>After period</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.after_period ?? 1}
                  onChange={(e) => setDraft({ ...draft, after_period: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.duration_minutes ?? 15}
                  onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.is_active ?? true}
                onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
              />
              <span className="text-sm">Active</span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={save.isPending}>
                {save.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save break
              </Button>
              <Button variant="ghost" onClick={() => { setDraft(null); setError(null); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {!draft && (
          <Button variant="outline" onClick={startNew} disabled={!canEdit}>
            <Plus className="h-4 w-4 mr-2" /> Add break
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
