import { useState, useMemo } from "react";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedSchoolId } from "@/hooks/progress/useResolvedSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface Student {
  id: string;
  name: string;
  roll_number: string | null;
  class_name: string | null;
  section: string | null;
}

interface RecordLeaveDialogProps {
  students: Student[];
  selectedClass: string;
  selectedSection: string;
}

export function RecordLeaveDialog({ students, selectedClass, selectedSection }: RecordLeaveDialogProps) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: schoolId } = useResolvedSchoolId();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const today = format(new Date(), "yyyy-MM-dd");

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );

  const dayCount = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).length;
  }, [startDate, endDate]);

  const handleSave = async () => {
    if (!studentId || !startDate || !endDate || !schoolId || !user) return;
    if (endDate < startDate) {
      toast({ title: "Invalid dates", description: "End date must be on or after start date.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const dates = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
      const records = dates.map(d => ({
        student_id: studentId,
        school_id: schoolId,
        date: format(d, "yyyy-MM-dd"),
        status: "leave" as const,
        marked_by: user.id,
        remarks: reason || null,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: "student_id,date" });

      if (error) throw error;

      toast({ title: "Leave recorded", description: `Marked ${dates.length} day(s) as leave.` });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStudentId("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CalendarOff className="h-4 w-4 text-blue-600" />
          Record Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Pre-Approved Leave</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Student selector */}
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {sortedStudents.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.roll_number ? `${s.roll_number}. ` : ""}{s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {dayCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {dayCount} day{dayCount > 1 ? "s" : ""} will be marked as leave
            </p>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Family function, medical leave…"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={saving || !studentId || !startDate || !endDate || dayCount === 0}
          >
            {saving ? "Saving…" : "Record Leave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
