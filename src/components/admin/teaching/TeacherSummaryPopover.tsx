import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Pencil } from "lucide-react";
import type { Teacher } from "@/hooks/useTeachers";
import type { SchoolTeachingAssignment } from "@/hooks/useTeachingAssignments";
import { groupAssignments } from "./TeachingChips";

interface Props {
  teacher: Teacher;
  assignments: SchoolTeachingAssignment[];
  subjectName: (id: string) => string;
  subjectOrder: (id: string) => number;
  onEdit?: (teacher: Teacher) => void;
  trigger: ReactNode;
}

/** Read-only summary of one teacher's assignments for the selected year (reuses matrix data). */
export function TeacherSummaryPopover({ teacher, assignments, subjectName, subjectOrder, onEdit, trigger }: Props) {
  const navigate = useNavigate();
  const groups = groupAssignments(assignments.filter(a => a.teacher_id === teacher.id), subjectName, subjectOrder);

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="start">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm">{teacher.name}</p>
          {!teacher.is_active && <Badge variant="outline" className="font-normal">Inactive</Badge>}
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="text-xs text-muted-foreground">No assignments for this academic year.</p>
          ) : groups.map(g => (
            <div key={g.subjectName}>
              <p className="text-sm font-medium">{g.subjectName}</p>
              <ul className="ml-4 list-disc text-sm text-muted-foreground">
                {g.classes.map(c => <li key={c}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1 border-t">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 mt-2"
            onClick={() => navigate(`/admin/settings?tab=timetable&ttab=view&mode=teacher&teacher=${teacher.id}`)}>
            <CalendarClock className="h-3.5 w-3.5" />View timetable
          </Button>
          {onEdit && (
            <Button size="sm" className="flex-1 gap-1.5 mt-2" onClick={() => onEdit(teacher)}>
              <Pencil className="h-3.5 w-3.5" />Edit
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
