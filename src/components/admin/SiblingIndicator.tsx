import { useMemo, useState } from "react";
import { Users2, Phone, Mail, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Student } from "@/hooks/useStudents";

interface SiblingIndicatorProps {
  student: Student;
  allStudents: Student[];
  onFilterStudent?: (name: string) => void;
}

const MAX_SIBLINGS_SHOWN = 10;

function normalize(val: string | null | undefined): string {
  return (val ?? "").trim().toLowerCase();
}

function truncate(val: string | null | undefined, max = 60): string {
  const s = (val ?? "").trim();
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function findSiblings(student: Student, allStudents: Student[]): Student[] {
  const phone = normalize(student.parent_phone);
  const parentName = normalize(student.parent_name);
  const guardian = normalize(student.guardian);
  const address = normalize(student.address);

  return allStudents.filter((s) => {
    if (s.id === student.id) return false;
    if (phone && normalize(s.parent_phone) === phone) return true;
    if (parentName.length > 2 && normalize(s.parent_name) === parentName) return true;
    if (guardian.length > 2 && normalize(s.guardian) === guardian) return true;
    if (address.length > 5 && normalize(s.address) === address) return true;
    return false;
  }).slice(0, MAX_SIBLINGS_SHOWN);
}

/** Shared content rendered inside HoverCard or Dialog */
function FamilyContent({
  student,
  siblings,
  onFilterStudent,
}: {
  student: Student;
  siblings: Student[];
  onFilterStudent?: (name: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Siblings */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
          Siblings
        </p>
        <ul className="space-y-1">
          {siblings.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <button
                className="font-medium text-primary hover:underline text-left"
                onClick={() => onFilterStudent?.(s.name)}
                type="button"
              >
                {s.name}
              </button>
              {(s.class_name || s.section) && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {s.class_name}
                  {s.section && `/${s.section}`}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Parent / Guardian Details */}
      {(student.parent_name || student.parent_phone || student.parent_email || student.guardian || student.address) && (
        <div className="border-t pt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            Parent / Guardian
          </p>
          <div className="space-y-1 text-sm">
            {student.parent_name && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <span>{student.parent_name}</span>
              </div>
            )}
            {student.guardian && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{student.guardian} (Guardian)</span>
              </div>
            )}
            {student.parent_phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                <span>+91 {student.parent_phone}</span>
              </div>
            )}
            {student.parent_email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <span>{student.parent_email}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{truncate(student.address)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SiblingIndicator({ student, allStudents, onFilterStudent }: SiblingIndicatorProps) {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);

  const siblings = useMemo(
    () => findSiblings(student, allStudents),
    [student, allStudents]
  );

  if (siblings.length === 0) return null;

  const memberCount = siblings.length + 1;

  const badge = (
    <Badge
      variant="outline"
      className="ml-1.5 cursor-pointer gap-1 text-xs px-1.5 py-0 border-primary/30 text-primary/80 hover:bg-primary/5 transition-colors"
      aria-describedby={`family-info-${student.id}`}
    >
      <Users2 className="h-3 w-3" />
      {memberCount}
    </Badge>
  );

  // Mobile: use Dialog on tap
  if (isMobile) {
    return (
      <>
        <span onClick={() => setDialogOpen(true)}>{badge}</span>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Family – {student.name}</DialogTitle>
            </DialogHeader>
            <FamilyContent student={student} siblings={siblings} onFilterStudent={(name) => { setDialogOpen(false); onFilterStudent?.(name); }} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: HoverCard
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span tabIndex={0} role="button">{badge}</span>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-72" id={`family-info-${student.id}`}>
        <FamilyContent student={student} siblings={siblings} onFilterStudent={onFilterStudent} />
      </HoverCardContent>
    </HoverCard>
  );
}

// Re-export the helper for use in StudentFamilyCard
export { findSiblings };
