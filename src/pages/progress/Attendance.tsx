import { useState, useMemo, useCallback, useEffect } from "react";
import { sortClassNames } from "@/lib/class-sort";
import { format, addDays, subDays } from "date-fns";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { useAttendanceByDate, useSaveAttendance, AttendanceStatus } from "@/hooks/useAttendance";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import { useUserRole } from "@/hooks/useUserRole";
import { useMyClassAssignments } from "@/hooks/useTeacherClasses";
import { useMySubjectIds } from "@/hooks/progress/useMySubjectIds";
import { useSubjects } from "@/hooks/progress/useSubjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { RecordLeaveDialog } from "@/components/progress/RecordLeaveDialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  Save,
  Users,
  CalendarOff,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToXLSX } from "@/lib/export-utils";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [localEntries, setLocalEntries] = useState<Map<string, AttendanceStatus>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { isTeacher } = useUserRole();
  const { data: myClassAssignments = [] } = useMyClassAssignments();
  const { data: allStudents, isLoading: studentsLoading } = useResolvedStudents();

  // Derive unique classes — filter by teacher's assigned classes if teacher
  const classes = useMemo(() => {
    const classSet = new Set<string>();
    (allStudents ?? []).forEach(s => {
      if (s.class_name) classSet.add(s.class_name);
    });
    let allClasses = sortClassNames(Array.from(classSet));

    // If teacher with assigned classes, filter to only those
    if (isTeacher && myClassAssignments.length > 0) {
      const assignedClassNames = new Set(myClassAssignments.map(a => a.class_name));
      allClasses = allClasses.filter(c => assignedClassNames.has(c));
    }

    return allClasses;
  }, [allStudents, isTeacher, myClassAssignments]);

  // Derive sections for selected class — filter by teacher's assigned sections
  const sections = useMemo(() => {
    if (!selectedClass) return [];
    const sectionSet = new Set<string>();
    (allStudents ?? []).forEach(s => {
      if (s.class_name === selectedClass && s.section) sectionSet.add(s.section);
    });
    let allSections = Array.from(sectionSet).sort();

    // If teacher with assigned classes, filter sections for this class
    if (isTeacher && myClassAssignments.length > 0) {
      const assignedSections = myClassAssignments
        .filter(a => a.class_name === selectedClass && a.section)
        .map(a => a.section!);
      if (assignedSections.length > 0) {
        allSections = allSections.filter(s => assignedSections.includes(s));
      }
    }

    return allSections;
  }, [allStudents, selectedClass, isTeacher, myClassAssignments]);
  

  // Auto-select first class
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  // Auto-select first section when class changes
  useEffect(() => {
    if (sections.length > 0) {
      setSelectedSection(sections[0]);
    } else {
      setSelectedSection('');
    }
  }, [sections]);

  const { data: attendanceData, isLoading: attendanceLoading } = useAttendanceByDate(
    selectedDate, selectedClass, selectedSection || undefined
  );
  const saveAttendance = useSaveAttendance();

  // When attendance data loads, populate local state
  useEffect(() => {
    if (attendanceData) {
      const map = new Map<string, AttendanceStatus>();
      attendanceData.forEach(item => {
        map.set(
          item.student.id,
          (item.attendance?.status as AttendanceStatus) ?? 'present'
        );
      });
      setLocalEntries(map);
      setHasUnsavedChanges(false);
    }
  }, [attendanceData]);

  const toggleStatus = useCallback((studentId: string) => {
    setLocalEntries(prev => {
      const next = new Map(prev);
      const current = next.get(studentId) || 'present';
      const cycle: AttendanceStatus[] = ['present', 'absent', 'late', 'leave'];
      const idx = cycle.indexOf(current);
      next.set(studentId, cycle[(idx + 1) % cycle.length]);
      return next;
    });
    setHasUnsavedChanges(true);
  }, []);

  const markAllPresent = useCallback(() => {
    if (!attendanceData) return;
    const map = new Map<string, AttendanceStatus>();
    attendanceData.forEach(item => map.set(item.student.id, 'present'));
    setLocalEntries(map);
    setHasUnsavedChanges(true);
  }, [attendanceData]);

  const handleSave = async () => {
    const entries = Array.from(localEntries.entries()).map(([student_id, status]) => ({
      student_id,
      status,
    }));

    const markedTime = selectedTime || null;

    try {
      await saveAttendance.mutateAsync({ date: selectedDate, entries, markedTime });
      toast({ title: "Attendance saved", description: `Saved for ${entries.length} students` });
      setHasUnsavedChanges(false);
    } catch (err: any) {
      toast({ title: "Error saving attendance", description: err.message, variant: "destructive" });
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    let present = 0, absent = 0, late = 0, leave = 0;
    localEntries.forEach(status => {
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'leave') leave++;
    });
    return { present, absent, late, leave, total: localEntries.size };
  }, [localEntries]);

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const isFuture = selectedDate > format(new Date(), 'yyyy-MM-dd');

  return (
    <ProgressLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Daily Attendance</h1>
            <p className="text-sm text-muted-foreground">Mark attendance for your class</p>
          </div>
          {attendanceData && attendanceData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = attendanceData.map(item => ({
                  'Name': item.student.name,
                  'Roll No': item.student.roll_number || '',
                  'Class': item.student.class_name || '',
                  'Section': item.student.section || '',
                  'Date': selectedDate,
                  'Status': (localEntries.get(item.student.id) || item.attendance?.status || 'present').toUpperCase(),
                }));
                exportToXLSX(rows, { filename: `attendance_${selectedClass || 'all'}_${selectedDate}`, sheetName: 'Attendance' });
                toast({ title: "Exported", description: `${rows.length} records exported` });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Date navigation */}
              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full text-center bg-background border border-input rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    const next = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
                    const today = format(new Date(), 'yyyy-MM-dd');
                    if (next <= today) setSelectedDate(next);
                  }}
                  disabled={isToday}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Time input */}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="bg-background border border-input rounded-md px-3 py-2 text-sm w-full sm:w-[120px]"
                />
              </div>

              {/* Class selector */}
              <Select value={selectedClass} onValueChange={(v) => setSelectedClass(v)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Section selector */}
              {sections.length > 0 && (
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(s => (
                      <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
              {isToday ? 'Today — ' : ''}{format(new Date(selectedDate), 'EEEE, dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>

        {/* Summary bar */}
        {summary.total > 0 && (
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-muted/60 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{summary.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-red-600">{summary.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-600">{summary.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{summary.leave}</p>
              <p className="text-xs text-muted-foreground">Leave</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        {attendanceData && attendanceData.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Mark All Present
            </Button>
            <RecordLeaveDialog
              students={(attendanceData ?? []).map(item => item.student)}
              selectedClass={selectedClass}
              selectedSection={selectedSection}
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveAttendance.isPending || !hasUnsavedChanges}
              className="gap-1.5 ml-auto"
            >
              <Save className="h-4 w-4" />
              {saveAttendance.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        )}

        {/* Student list */}
        {(attendanceLoading || studentsLoading) ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : isFuture ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Cannot mark attendance for future dates.</p>
            </CardContent>
          </Card>
        ) : !selectedClass ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select a class to begin marking attendance.</p>
            </CardContent>
          </Card>
        ) : attendanceData && attendanceData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No students found in Class {selectedClass}{selectedSection ? `, Section ${selectedSection}` : ''}.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {attendanceData?.map((item, index) => {
              const status = localEntries.get(item.student.id) || 'present';
              return (
                <button
                  key={item.student.id}
                  onClick={() => toggleStatus(item.student.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                    status === 'present' && "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
                    status === 'absent' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
                    status === 'late' && "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
                    status === 'leave' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
                  )}
                >
                  <span className="text-xs text-muted-foreground w-6 text-center shrink-0">
                    {item.student.roll_number || (index + 1)}
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {item.student.name}
                  </span>
                  <StatusBadge status={status} />
                </button>
              );
            })}
          </div>
        )}

        {/* Floating save button on mobile */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-4 left-4 right-4 sm:hidden z-50">
            <Button
              className="w-full shadow-lg gap-2"
              size="lg"
              onClick={handleSave}
              disabled={saveAttendance.isPending}
            >
              <Save className="h-5 w-5" />
              {saveAttendance.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        )}
      </div>
    </ProgressLayout>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  switch (status) {
    case 'present':
      return (
        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700 gap-1 shrink-0">
          <Check className="h-3 w-3" /> P
        </Badge>
      );
    case 'absent':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700 gap-1 shrink-0">
          <X className="h-3 w-3" /> A
        </Badge>
      );
    case 'late':
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700 gap-1 shrink-0">
          <Clock className="h-3 w-3" /> L
        </Badge>
      );
    case 'leave':
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 gap-1 shrink-0">
          <CalendarOff className="h-3 w-3" /> Lv
        </Badge>
      );
  }
}
