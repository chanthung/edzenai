import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Student, useUpdateStudent } from "@/hooks/useStudents";
import { toast } from "sonner";

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({ student, open, onOpenChange }: EditStudentDialogProps) {
  const updateStudent = useUpdateStudent();
  const [formData, setFormData] = useState({
    name: "",
    roll_number: "",
    class_name: "",
    section: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    guardian: "",
    address: "",
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        roll_number: student.roll_number || "",
        class_name: student.class_name || "",
        section: student.section || "",
        parent_name: student.parent_name || "",
        parent_phone: student.parent_phone || "",
        parent_email: student.parent_email || "",
        guardian: student.guardian || "",
        address: student.address || "",
      });
    }
  }, [student]);

  const handleSubmit = async () => {
    if (!student) return;
    
    if (!formData.name.trim()) {
      toast.error("Student name is required");
      return;
    }

    if (!formData.parent_phone.trim()) {
      toast.error("Parent phone number is required");
      return;
    }

    try {
      await updateStudent.mutateAsync({
        id: student.id,
        ...formData,
      });
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
          <DialogDescription>
            Update student and parent details.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="grid gap-4 py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Student Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-roll">Roll Number</Label>
                <Input
                  id="edit-roll"
                  placeholder="2024001"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-class">Class</Label>
                <Input
                  id="edit-class"
                  placeholder="10th"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input
                  id="edit-section"
                  placeholder="A"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Parent & Contact Details</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-parentName">Parent Name</Label>
                  <Input
                    id="edit-parentName"
                    placeholder="Mr. Vijay Sharma"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-parentPhone">Phone *</Label>
                    <Input
                      id="edit-parentPhone"
                      placeholder="9876543210"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-parentEmail">Email</Label>
                    <Input
                      id="edit-parentEmail"
                      type="email"
                      placeholder="parent@email.com"
                      value={formData.parent_email}
                      onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    placeholder="123, Main Street, City"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Guardian Details (if different from parent)</p>
              <div className="space-y-2">
                <Label htmlFor="edit-guardian">Guardian Name & Relation</Label>
                <Input
                  id="edit-guardian"
                  placeholder="Mr. Ramesh Sharma (Uncle)"
                  value={formData.guardian}
                  onChange={(e) => setFormData({ ...formData, guardian: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateStudent.isPending}>
            {updateStudent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
