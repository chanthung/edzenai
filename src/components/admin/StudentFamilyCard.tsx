import { useMemo } from "react";
import { Users2, Phone, Mail, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Student } from "@/hooks/useStudents";
import { findSiblings } from "./SiblingIndicator";

interface StudentFamilyCardProps {
  student: Student;
  allStudents: Student[];
}

export function StudentFamilyCard({ student, allStudents }: StudentFamilyCardProps) {
  const siblings = useMemo(
    () => findSiblings(student, allStudents),
    [student, allStudents]
  );

  const hasParentInfo = student.parent_name || student.parent_phone || student.parent_email || student.address;
  const hasGuardian = student.guardian;

  if (siblings.length === 0 && !hasParentInfo && !hasGuardian) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Users2 className="h-4 w-4 text-primary" />
          Family Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parent Cards */}
        {hasParentInfo && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parent</p>
            {student.parent_name && (
              <div className="flex items-center gap-1.5 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{student.parent_name}</span>
              </div>
            )}
            {student.parent_phone && (
              <div className="flex items-center gap-1.5 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>+91 {student.parent_phone}</span>
              </div>
            )}
            {student.parent_email && (
              <div className="flex items-center gap-1.5 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{student.parent_email}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{student.address}</span>
              </div>
            )}
          </div>
        )}

        {hasGuardian && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guardian</p>
            <div className="flex items-center gap-1.5 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{student.guardian}</span>
            </div>
          </div>
        )}

        {/* Siblings */}
        {siblings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Siblings ({siblings.length})
            </p>
            <ul className="space-y-1.5">
              {siblings.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  {(s.class_name || s.section) && (
                    <Badge variant="secondary" className="text-xs">
                      {s.class_name}{s.section && `/${s.section}`}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
