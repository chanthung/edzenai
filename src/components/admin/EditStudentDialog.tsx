import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Student, useUpdateStudent } from "@/hooks/useStudents";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({ student, open, onOpenChange }: EditStudentDialogProps) {
  const updateStudent = useUpdateStudent();
  const queryClient = useQueryClient();
  const { data: academicYears } = useAcademicYears();
  
  const { data: currentEnrollment } = useQuery({
    queryKey: ['student-enrollment', student?.id],
    queryFn: async () => {
      if (!student?.id) return null;
      const { data, error } = await supabase
        .from('student_enrollments')
        .select('*')
        .eq('student_id', student.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id && open,
  });
  
  const [formData, setFormData] = useState({
    name: "",
    roll_number: "",
    class_name: "",
    section: "",
    academic_year_id: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    guardian: "",
    address: "",
    gender: "",
    date_of_birth: "",
    social_category: "",
    aadhaar_number: "",
    religion: "",
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        roll_number: student.roll_number || "",
        class_name: student.class_name || "",
        section: student.section || "",
        academic_year_id: currentEnrollment?.academic_year_id || "",
        parent_name: student.parent_name || "",
        parent_phone: student.parent_phone || "",
        parent_email: student.parent_email || "",
        guardian: student.guardian || "",
        address: student.address || "",
        gender: student.gender || "",
        date_of_birth: student.date_of_birth || "",
        social_category: student.social_category || "",
        aadhaar_number: student.aadhaar_number || "",
        religion: student.religion || "",
      });
    }
  }, [student, currentEnrollment]);

  const handleSubmit = async () => {
    if (!student) return;
    if (!formData.name.trim()) { toast.error("Student name is required"); return; }
    const phoneDigits = formData.parent_phone.replace(/\D/g, '');
    if (!phoneDigits) { toast.error("Parent phone number is required"); return; }
    if (phoneDigits.length !== 10) { toast.error("Phone number must be exactly 10 digits"); return; }

    try {
      const { academic_year_id, ...studentData } = formData;
      // Convert empty strings to null for nullable fields to avoid DB type errors
      const sanitized = Object.fromEntries(
        Object.entries(studentData).map(([key, value]) => [key, value === "" ? null : value])
      ) as typeof studentData;
      await updateStudent.mutateAsync({ id: student.id, ...sanitized });
      
      if (academic_year_id) {
        if (currentEnrollment) {
          const { error } = await supabase
            .from('student_enrollments')
            .update({ academic_year_id, class_name: studentData.class_name || null, section: studentData.section || null })
            .eq('id', currentEnrollment.id);
          if (error) console.error('Failed to update enrollment:', error);
        } else {
          const { error } = await supabase
            .from('student_enrollments')
            .insert({ student_id: student.id, academic_year_id, class_name: studentData.class_name || null, section: studentData.section || null });
          if (error) console.error('Failed to create enrollment:', error);
        }
        queryClient.invalidateQueries({ queryKey: ['student-enrollment', student.id] });
        queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      }
      
      toast.success("Student updated successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update student", { description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student and parent details.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="grid gap-4 py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Student Name *</Label>
                <Input id="edit-name" placeholder="Rahul Sharma" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-roll">Roll Number</Label>
                <Input id="edit-roll" placeholder="2024001" value={formData.roll_number} onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-academic-year">Academic Year</Label>
              <Select value={formData.academic_year_id} onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem key={year.id} value={year.id}>{year.name} {year.is_active && "(Active)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-class">Class</Label>
                <Input id="edit-class" placeholder="10th" value={formData.class_name} onChange={(e) => setFormData({ ...formData, class_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input id="edit-section" placeholder="A" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} />
              </div>
            </div>

            {/* Personal Details */}
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Personal Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                  {formData.date_of_birth && (
                    <p className="text-xs text-muted-foreground">Age: {calculateAge(formData.date_of_birth)} years</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Social Category</Label>
                  <Select value={formData.social_category} onValueChange={(value) => setFormData({ ...formData, social_category: value })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Minority">Minority</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Select value={formData.religion} onValueChange={(value) => setFormData({ ...formData, religion: value })}>
                    <SelectTrigger><SelectValue placeholder="Select religion" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buddhism">Buddhism</SelectItem>
                      <SelectItem value="Christianity">Christianity</SelectItem>
                      <SelectItem value="Hinduism">Hinduism</SelectItem>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Jainism">Jainism</SelectItem>
                      <SelectItem value="Judaism">Judaism</SelectItem>
                      <SelectItem value="Sikhism">Sikhism</SelectItem>
                      <SelectItem value="Zoroastrianism">Zoroastrianism</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Aadhaar Number</Label>
                <Input placeholder="123456789012" maxLength={12} value={formData.aadhaar_number} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 12); setFormData({ ...formData, aadhaar_number: val }); }} />
              </div>
            </div>

            {/* Parent & Contact Details */}
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Parent & Contact Details</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-parentName">Parent Name</Label>
                  <Input id="edit-parentName" placeholder="Mr. Vijay Sharma" value={formData.parent_name} onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-parentPhone">Phone *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                      <Input id="edit-parentPhone" placeholder="9876543210" className="pl-12" maxLength={10} value={formData.parent_phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setFormData({ ...formData, parent_phone: val }); }} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-parentEmail">Email</Label>
                    <Input id="edit-parentEmail" type="email" placeholder="parent@email.com" value={formData.parent_email} onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" placeholder="123, Main Street, City" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Guardian Details (if different from parent)</p>
              <div className="space-y-2">
                <Label htmlFor="edit-guardian">Guardian Name & Relation</Label>
                <Input id="edit-guardian" placeholder="Mr. Ramesh Sharma (Uncle)" value={formData.guardian} onChange={(e) => setFormData({ ...formData, guardian: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateStudent.isPending}>
            {updateStudent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
