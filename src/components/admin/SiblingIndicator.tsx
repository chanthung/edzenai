import { useMemo } from "react";
import { Users2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Student } from "@/hooks/useStudents";

interface SiblingIndicatorProps {
  student: Student;
  allStudents: Student[];
}

const MAX_SIBLINGS_SHOWN = 5;

function normalize(val: string | null | undefined): string {
  return (val ?? "").trim().toLowerCase();
}

export function SiblingIndicator({ student, allStudents }: SiblingIndicatorProps) {
  const siblings = useMemo(() => {
    const phone = normalize(student.parent_phone);
    const parentName = normalize(student.parent_name);
    const guardian = normalize(student.guardian);
    const address = normalize(student.address);

    return allStudents.filter((s) => {
      if (s.id === student.id) return false;

      // Match on parent phone (strongest signal, skip empty)
      if (phone && normalize(s.parent_phone) === phone) return true;

      // Match on parent name (skip empty / very short)
      if (parentName.length > 2 && normalize(s.parent_name) === parentName) return true;

      // Match on guardian
      if (guardian.length > 2 && normalize(s.guardian) === guardian) return true;

      // Match on address (skip empty / very short)
      if (address.length > 5 && normalize(s.address) === address) return true;

      return false;
    }).slice(0, MAX_SIBLINGS_SHOWN);
  }, [student, allStudents]);

  if (siblings.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-5 h-5 ml-1.5 cursor-help text-primary/70 hover:text-primary transition-colors">
            <Users2 className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Possible sibling(s) in this school:
          </p>
          <ul className="space-y-0.5">
            {siblings.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-medium">{s.name}</span>
                {(s.class_name || s.section) && (
                  <span className="text-muted-foreground">
                    {" – "}
                    {s.class_name}
                    {s.section && `/${s.section}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
