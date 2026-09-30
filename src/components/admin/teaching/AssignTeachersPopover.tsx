import { useMemo, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import type { SchoolTeachingAssignment } from "@/hooks/useTeachingAssignments";
import type { Teacher } from "@/hooks/useTeachers";

interface Props {
  subjectId: string;
  subjectName: string;
  className: string;
  academicYearId: string;
  teachers: Teacher[]; // all school users (active + inactive)
  assignments: SchoolTeachingAssignment[]; // all rows for the school + year
  trigger: ReactNode;
  disabled?: boolean;
}

/**
 * Assign one or more teachers to a subject–class pair for a year.
 * Saves through the existing Edit Teacher mechanism (useTeacherSubjects.updateAssignments),
 * rewriting each affected teacher's full year assignment list.
 */
export function AssignTeachersPopover({ subjectId, subjectName, className, academicYearId, teachers, assignments, trigger, disabled }: Props) {
  const { updateAssignments } = useTeacherSubjects(undefined, null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const current = useMemo(
    () => new Set(assignments.filter(a => a.subject_id === subjectId && a.class_name === className).map(a => a.teacher_id)),
    [assignments, subjectId, className],
  );

  // Selectable: active teachers only. Inactive teachers already assigned stay visible (muted, removable only).
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers
      .filter(t => t.role === "teacher" && (t.is_active || current.has(t.id)))
      .filter(t => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers, current, search]);

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) { setSelected(new Set(current)); setSearch(""); }
  };

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });

  const save = async () => {
    const changed = [...new Set([...current, ...selected])].filter(id => current.has(id) !== selected.has(id));
    if (changed.length === 0) { setOpen(false); return; }
    setSaving(true);
    try {
      for (const teacherId of changed) {
        const others = assignments
          .filter(a => a.teacher_id === teacherId && !(a.subject_id === subjectId && a.class_name === className))
          .map(a => ({ subject_id: a.subject_id, class_name: a.class_name }));
        const next = selected.has(teacherId) ? [...others, { subject_id: subjectId, class_name: className }] : others;
        await updateAssignments.mutateAsync({ teacherId, academicYearId, assignments: next });
      }
      setOpen(false);
    } catch {
      // toast shown by the mutation
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-3" align="start">
        <div>
          <p className="text-sm font-medium">{subjectName}</p>
          <p className="text-xs text-muted-foreground">{className} · all sections</p>
        </div>
        <Input placeholder="Search teachers" value={search} onChange={e => setSearch(e.target.value)} className="h-8" />
        <div className="max-h-56 overflow-y-auto space-y-1">
          {list.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No teachers available.</p>
          ) : list.map(t => (
            <label key={t.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={selected.has(t.id)}
                onCheckedChange={() => toggle(t.id)}
                disabled={!t.is_active && !selected.has(t.id)}
              />
              <span className={t.is_active ? "text-sm" : "text-sm text-muted-foreground line-through"}>{t.name}</span>
              {!t.is_active && <span className="text-[10px] text-muted-foreground ml-auto">inactive</span>}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
