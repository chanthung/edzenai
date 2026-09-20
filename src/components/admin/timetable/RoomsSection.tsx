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
import { DoorOpen, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { ROOM_TYPES, labelOf } from "./constants";
import { useTimetableConfig } from "./TimetableConfigContext";
import {
  useTimetableRooms,
  useRoomMutations,
  TimetableRoom,
} from "@/hooks/timetable/useTimetableConfigData";

export function RoomsSection() {
  const { schoolId, canEdit } = useTimetableConfig();
  const { data: rooms = [], isLoading } = useTimetableRooms(schoolId);
  const { save, remove } = useRoomMutations(schoolId);

  const [draft, setDraft] = useState<Partial<TimetableRoom> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!draft) return;
    if (!draft.name?.trim()) return setError("Enter a room name.");
    setError(null);
    save.mutate(draft, { onSuccess: () => setDraft(null) });
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Rooms</CardTitle>
        <CardDescription>
          Rooms belong to the school and are shared across all academic years — you only set them up
          once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : rooms.length === 0 && !draft ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <DoorOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No rooms yet. Add your classrooms, labs and halls.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    <Badge variant="outline">{labelOf(ROOM_TYPES, r.room_type)}</Badge>
                    {!r.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.capacity ? `Seats ${r.capacity}` : "Capacity not set"}
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
                    aria-label="Remove room"
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Room name</Label>
                <Input
                  value={draft.name ?? ""}
                  placeholder="Science Lab 1"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Room type</Label>
                <Select
                  value={draft.room_type ?? "classroom"}
                  onValueChange={(v) => setDraft({ ...draft, room_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.capacity ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, capacity: e.target.value ? Number(e.target.value) : null })
                  }
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
                Save room
              </Button>
              <Button variant="ghost" onClick={() => { setDraft(null); setError(null); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {!draft && (
          <Button variant="outline" onClick={() => setDraft({ room_type: "classroom", is_active: true })} disabled={!canEdit}>
            <Plus className="h-4 w-4 mr-2" /> Add room
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
