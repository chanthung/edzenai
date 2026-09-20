import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { ROOM_TYPES, labelOf } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import {
  useRoomRequirements,
  useRoomRequirementMutations,
  useTimetableRooms,
  RoomRequirement,
} from "@/hooks/timetable/useTimetableConfigData";
import { useSchoolSubjects, useEnrolledClassSections } from "@/hooks/timetable/useTimetableSourceData";

export function RoomRequirementsSection() {
  const { schoolId, academicYearId, canEdit } = useTimetableConfig();
  const scope = { schoolId, academicYearId };
  const { data: requirements = [], isLoading } = useRoomRequirements(scope);
  const { save, remove } = useRoomRequirementMutations(scope);
  const { data: rooms = [] } = useTimetableRooms(schoolId);
  const { data: subjectData } = useSchoolSubjects(schoolId);
  const { data: classSections = [] } = useEnrolledClassSections(academicYearId);

  const [draft, setDraft] = useState<Partial<RoomRequirement> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjects = subjectData?.subjects ?? [];
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "Subject";
  const roomName = (id?: string | null) => rooms.find((r) => r.id === id)?.name ?? "Any room";

  const handleSave = () => {
    if (!draft) return;
    if (!draft.subject_id) return setError("Choose a subject.");
    if (!draft.required_room_type && !draft.preferred_room_id)
      return setError("Choose a required room type or a preferred room.");
    setError(null);
    save.mutate(draft, { onSuccess: () => setDraft(null) });
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Room requirements</CardTitle>
        <CardDescription>
          Which kind of room a subject needs — for example Science must be taught in a science lab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : requirements.length === 0 && !draft ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No room requirements yet. Most subjects can use any classroom — add rules only where a
              special room is needed.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {requirements.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{subjectName(r.subject_id)}</span>
                    {r.class_name && <Badge variant="outline">{r.class_name}</Badge>}
                    {r.is_mandatory && <Badge>Mandatory</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Required room: {labelOf(ROOM_TYPES, r.required_room_type ?? undefined)} · Preferred:{" "}
                    {roomName(r.preferred_room_id)}
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
                    {Array.from(new Set(classSections.map((c) => c.class_name))).map((c) => (
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
                    <SelectItem value="none">No preference</SelectItem>
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
                    <SelectItem value="none">Any room</SelectItem>
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
              <span className="text-sm">Mandatory</span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={save.isPending}>
                {save.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save requirement
              </Button>
              <Button variant="ghost" onClick={() => { setDraft(null); setError(null); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {!draft && (
          <Button
            variant="outline"
            disabled={!canEdit || rooms.length === 0}
            onClick={() => setDraft({ is_mandatory: false, academic_year_id: academicYearId })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add requirement
          </Button>
        )}
        {rooms.length === 0 && (
          <p className="text-sm text-muted-foreground">Add rooms first to set room requirements.</p>
        )}
      </CardContent>
    </Card>
  );
}
