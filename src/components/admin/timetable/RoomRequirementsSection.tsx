import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Info, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { ROOM_TYPES, DELIVERY_MODES, labelOf } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import {
  useRoomRequirements,
  useRoomRequirementMutations,
  useTimetableRooms,
  useSubjectRequirements,
  RoomRequirement,
} from "@/hooks/timetable/useTimetableConfigData";
import { useSchoolSubjects } from "@/hooks/timetable/useTimetableSourceData";

/** Delivery modes that may need a special facility. Theory never does. */
const SPECIAL_MODES = ["practical", "lab", "activity"];

/** A suggestion only — nothing is created automatically. */
function suggestRoomType(mode: string, subject: string): string | null {
  const s = subject.toLowerCase();
  if (mode === "activity") {
    if (/(physical|sport|game|yoga|pe\b)/.test(s)) return "sports";
    if (/(music)/.test(s)) return "music";
    if (/(art|craft|draw)/.test(s)) return "art";
    return null;
  }
  if (mode === "practical" || mode === "lab") {
    if (/(comput|informatic|it\b|coding)/.test(s)) return "computer_lab";
    if (/(science|physic|chem|bio)/.test(s)) return "science_lab";
    return null;
  }
  return null;
}

export function RoomRequirementsSection() {
  const { schoolId, academicYearId, canEdit } = useTimetableConfig();
  const scope = { schoolId, academicYearId };
  const { data: requirements = [], isLoading } = useRoomRequirements(scope);
  const { save, remove } = useRoomRequirementMutations(scope);
  const { data: rooms = [] } = useTimetableRooms(schoolId);
  const { data: subjectData } = useSchoolSubjects(schoolId);
  const { data: subjectRequirements = [] } = useSubjectRequirements(scope);

  const [draft, setDraft] = useState<Partial<RoomRequirement> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjects = subjectData?.subjects ?? [];
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "Subject";
  const roomName = (id?: string | null) => rooms.find((r) => r.id === id)?.name ?? "Any room";

  /** Subject + class combinations taught in a special delivery mode. */
  const specialCandidates = useMemo(() => {
    const map = new Map<
      string,
      { subject_id: string; class_name: string | null; modes: Set<string> }
    >();
    for (const r of subjectRequirements) {
      if (!SPECIAL_MODES.includes(r.delivery_mode)) continue;
      const key = `${r.subject_id}||${r.class_name}`;
      const entry = map.get(key) ?? {
        subject_id: r.subject_id,
        class_name: r.class_name,
        modes: new Set<string>(),
      };
      entry.modes.add(r.delivery_mode);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) =>
      `${subjectName(a.subject_id)}${a.class_name}`.localeCompare(
        `${subjectName(b.subject_id)}${b.class_name}`,
        undefined,
        { numeric: true }
      )
    );
  }, [subjectRequirements, subjects]);

  const isCovered = (subject_id: string, class_name: string | null) =>
    requirements.some(
      (r) => r.subject_id === subject_id && (r.class_name === null || r.class_name === class_name)
    );

  const uncovered = specialCandidates.filter((c) => !isCovered(c.subject_id, c.class_name));
  const theoryOnlyCount = subjectRequirements.filter(
    (r) => !SPECIAL_MODES.includes(r.delivery_mode)
  ).length;

  const classOptions = useMemo(
    () => Array.from(new Set(subjectRequirements.map((r) => r.class_name))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    ),
    [subjectRequirements]
  );

  const startDraft = (prefill?: Partial<RoomRequirement>) => {
    setError(null);
    setDraft({ is_mandatory: false, academic_year_id: academicYearId, ...prefill });
  };

  const handleSave = () => {
    if (!draft) return;
    if (!draft.subject_id) return setError("Choose a subject.");
    if (!draft.required_room_type && !draft.preferred_room_id)
      return setError("Choose a required room type or a preferred room.");
    setError(null);
    save.mutate(draft, { onSuccess: () => setDraft(null) });
  };

  return (
    <div className="space-y-4">
      <Alert className="rounded-xl">
        <Info className="h-4 w-4" />
        <AlertTitle>Special rooms only</AlertTitle>
        <AlertDescription>
          Ordinary classroom allocation is not configured here. Regular theory lessons are placed in
          the class's normal room automatically. Add a rule only when a lesson genuinely needs a
          special facility — a computer lab, a science lab, a sports ground, an art or music room.
        </AlertDescription>
      </Alert>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Lessons that may need a special room</CardTitle>
          <CardDescription>
            Taken from the delivery mode you set in Subject Requirements. Practical, lab and activity
            lessons appear here; theory lessons never do.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {specialCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No practical, lab or activity lessons are configured yet. Set the delivery mode in
              Subject Requirements first — {theoryOnlyCount} lesson
              {theoryOnlyCount === 1 ? " is" : "s are"} currently theory and needs no special room.
            </p>
          ) : uncovered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Every practical, lab and activity lesson already has a special room rule.
            </p>
          ) : (
            uncovered.map((c) => {
              const suggestion = suggestRoomType(
                Array.from(c.modes)[0],
                subjectName(c.subject_id)
              );
              return (
                <div
                  key={`${c.subject_id}-${c.class_name}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{subjectName(c.subject_id)}</span>
                      {c.class_name && <Badge variant="outline">{c.class_name}</Badge>}
                      {Array.from(c.modes).map((m) => (
                        <Badge key={m} variant="secondary">
                          {labelOf(DELIVERY_MODES, m)}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion
                        ? `Suggested: ${labelOf(ROOM_TYPES, suggestion)} — confirm or choose another.`
                        : "No rule yet. Add one only if this lesson needs a special facility."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canEdit}
                    onClick={() =>
                      startDraft({
                        subject_id: c.subject_id,
                        class_name: c.class_name,
                        required_room_type: suggestion,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add rule
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Special room rules</CardTitle>
          <CardDescription>
            Only these rules constrain the future timetable. Subjects without a rule can be taught in
            any ordinary classroom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : requirements.length === 0 && !draft ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No special room rules yet. That is perfectly fine — most lessons need nothing more
                than a normal classroom.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requirements.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{subjectName(r.subject_id)}</span>
                      {r.class_name && <Badge variant="outline">{r.class_name}</Badge>}
                      {r.is_mandatory && <Badge>Mandatory</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Required room: {labelOf(ROOM_TYPES, r.required_room_type ?? undefined)} ·
                      Preferred: {roomName(r.preferred_room_id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" disabled={!canEdit} onClick={() => setDraft(r)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!canEdit}
                      onClick={() => remove.mutate(r.id)}
                      aria-label="Remove requirement"
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
                  <Label>Subject</Label>
                  <Select
                    value={draft.subject_id ?? ""}
                    onValueChange={(v) => setDraft({ ...draft, subject_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class (optional)</Label>
                  <Select
                    value={draft.class_name ?? "all"}
                    onValueChange={(v) => setDraft({ ...draft, class_name: v === "all" ? null : v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {classOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Required room type</Label>
                  <Select
                    value={draft.required_room_type ?? "none"}
                    onValueChange={(v) =>
                      setDraft({ ...draft, required_room_type: v === "none" ? null : v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No special room</SelectItem>
                      {ROOM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred room</Label>
                  <Select
                    value={draft.preferred_room_id ?? "none"}
                    onValueChange={(v) =>
                      setDraft({ ...draft, preferred_room_id: v === "none" ? null : v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any room of that type</SelectItem>
                      {rooms.filter((r) => r.is_active).map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.is_mandatory ?? false}
                  onCheckedChange={(v) => setDraft({ ...draft, is_mandatory: v })}
                />
                <span className="text-sm">Mandatory — the lesson cannot be placed anywhere else</span>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={save.isPending}>
                  {save.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save rule
                </Button>
                <Button variant="ghost" onClick={() => { setDraft(null); setError(null); }}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </div>
            </div>
          )}

          {!draft && (
            <Button variant="outline" disabled={!canEdit || rooms.length === 0} onClick={() => startDraft()}>
              <Plus className="h-4 w-4 mr-2" /> Add special room rule
            </Button>
          )}
          {rooms.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add rooms first to set special room rules.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
