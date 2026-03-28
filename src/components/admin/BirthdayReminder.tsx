import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cake, PartyPopper, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import type { Student } from "@/hooks/useStudents";

interface BirthdayInfo {
  student: Student;
  daysUntil: number;
  turningAge: number;
}

/**
 * Calculate upcoming birthdays within the next 7 days.
 * Handles month/year wrap-around by comparing month+day only.
 */
function getUpcomingBirthdays(students: Student[]): BirthdayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: BirthdayInfo[] = [];

  for (const student of students) {
    if (!student.date_of_birth) continue;

    const dob = new Date(student.date_of_birth);
    // Build this year's birthday
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    birthdayThisYear.setHours(0, 0, 0, 0);

    let nextBirthday = birthdayThisYear;
    // If birthday already passed this year, use next year's
    if (birthdayThisYear < today) {
      nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    }

    const diffMs = nextBirthday.getTime() - today.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntil <= 7) {
      const turningAge = nextBirthday.getFullYear() - dob.getFullYear();
      results.push({ student, daysUntil, turningAge });
    }
  }

  // Sort ascending by days until birthday
  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Today! 🎉";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

interface BirthdayReminderProps {
  students: Student[];
}

export function BirthdayReminder({ students }: BirthdayReminderProps) {
  const [expanded, setExpanded] = useState(false);

  const birthdays = useMemo(() => getUpcomingBirthdays(students), [students]);
  const visibleBirthdays = expanded ? birthdays : birthdays.slice(0, 5);
  const hasMore = birthdays.length > 5;

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cake className="h-5 w-5 text-primary" />
          Upcoming Birthdays
          {birthdays.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {birthdays.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {birthdays.length === 0 ? (
          <div className="text-center py-6">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No birthdays this week</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleBirthdays.map((b) => {
              const isToday = b.daysUntil === 0;
              return (
                <div
                  key={b.student.id}
                  className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                    isToday
                      ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                      isToday
                        ? "bg-amber-200 dark:bg-amber-800"
                        : "bg-primary/10"
                    }`}
                  >
                    {isToday ? (
                      <PartyPopper className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                    ) : (
                      <Cake className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isToday ? "text-amber-900 dark:text-amber-100" : ""}`}>
                      {b.student.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.student.class_name || "—"}
                      {b.student.section ? ` • ${b.student.section}` : ""}
                      {" • "}Turning {b.turningAge}
                    </p>
                  </div>

                  {/* Days badge */}
                  <Badge
                    variant={isToday ? "default" : "outline"}
                    className={`flex-shrink-0 text-xs ${
                      isToday ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : ""
                    }`}
                  >
                    {getDaysLabel(b.daysUntil)}
                  </Badge>
                </div>
              );
            })}

            {/* View all / collapse toggle */}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1 text-xs"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                ) : (
                  <>View all {birthdays.length} <ChevronDown className="h-3 w-3 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
