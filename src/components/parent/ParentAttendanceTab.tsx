import { useStudentAttendanceSummary } from "@/hooks/useAttendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Clock, CalendarDays, CalendarOff } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ParentAttendanceTabProps {
  accessToken: string;
  studentName: string;
}

export function ParentAttendanceTab({ accessToken, studentName }: ParentAttendanceTabProps) {
  const { data, isLoading } = useStudentAttendanceSummary(accessToken);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No attendance records available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, byMonth } = data;

  return (
    <div className="space-y-4">
      {/* Overall summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={summary.percentage >= 75 ? "hsl(142, 76%, 36%)" : summary.percentage >= 50 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)"}
                  strokeWidth="3"
                  strokeDasharray={`${summary.percentage}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">{summary.percentage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <Check className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{summary.present}</span>
              </div>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <X className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{summary.absent}</span>
              </div>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{summary.late}</span>
              </div>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <CalendarOff className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{summary.leave ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Leave</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month-wise breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(byMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, data]) => {
                const pct = data.total > 0 ? Math.round((data.present + data.late) * 100 / data.total) : 0;
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-20 shrink-0">
                      {format(parseISO(month + '-01'), 'MMM yyyy')}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 75 ? 'hsl(142, 76%, 36%)' : pct >= 50 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)',
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Recent records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data.records.slice(0, 30).map((record, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">
                  {format(parseISO(record.date), 'dd MMM, EEE')}
                </span>
                <Badge
                  variant="outline"
                  className={
                    record.status === 'present'
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300"
                      : record.status === 'absent'
                      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300"
                      : record.status === 'leave'
                      ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300"
                      : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300"
                  }
                >
                  {record.status === 'present' ? 'P' : record.status === 'absent' ? 'A' : record.status === 'leave' ? 'Lv' : 'L'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
