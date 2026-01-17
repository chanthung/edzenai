import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudents, useCreateStudent, useDeleteStudent, Student } from "@/hooks/useStudents";
import { useStudentFees } from "@/hooks/useStudentFees";
import { StudentFeeManager } from "@/components/admin/StudentFeeManager";
import { PaymentRecorder } from "@/components/admin/PaymentRecorder";
import { EditStudentDialog } from "@/components/admin/EditStudentDialog";
import { toast } from "sonner";
import { Plus, Users, Copy, ExternalLink, Trash2, Search, Loader2, IndianRupee, CreditCard, CheckCircle2, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useQuery } from "@tanstack/react-query";

export default function Students() {
  const { data: students, isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const { data: school } = useSchool();

  // Fetch all student fees to show assignment indicators
  const { data: allStudentFees } = useQuery({
    queryKey: ['all-student-fees', school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      const { data, error } = await supabase
        .from('student_fees')
        .select('student_id, fee_structure_id');
      if (error) throw error;
      return data || [];
    },
    enabled: !!school?.id,
  });

  // Create a map of student_id -> count of assigned fees
  const studentFeeCountMap = useMemo(() => {
    const map = new Map<string, number>();
    allStudentFees?.forEach(sf => {
      map.set(sf.student_id, (map.get(sf.student_id) || 0) + 1);
    });
    return map;
  }, [allStudentFees]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feeManagerStudent, setFeeManagerStudent] = useState<Student | null>(null);
  const [paymentRecorderStudent, setPaymentRecorderStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({
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

  // Get unique classes for filter dropdown
  const uniqueClasses = useMemo(() => {
    if (!students) return [];
    const classes = new Set(students.map(s => s.class_name).filter(Boolean));
    return Array.from(classes).sort();
  }, [students]);

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.class_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = classFilter === "all" || student.class_name === classFilter;
    
    return matchesSearch && matchesClass;
  });

  const handleCreateStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error("Student name is required");
      return;
    }

    try {
      await createStudent.mutateAsync(newStudent);
      toast.success("Student added successfully");
      setDialogOpen(false);
      setNewStudent({
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
    } catch (error: any) {
      toast.error("Failed to add student", { description: error.message });
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await deleteStudent.mutateAsync(id);
      toast.success("Student deleted");
    } catch (error: any) {
      toast.error("Failed to delete student", { description: error.message });
    }
  };

  const copyParentLink = (student: Student) => {
    const link = `${window.location.origin}/view/${student.access_token}`;
    navigator.clipboard.writeText(link);
    toast.success("Parent link copied!", { description: "Share this link with the parent" });
  };

  return (
    <AdminLayout>
      <PageHeader title="Students" description="Manage student records and parent access links">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter student and parent details. A unique link will be generated for parent access.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 max-h-[60vh] overflow-auto pr-4">
              <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Student Name *</Label>
                  <Input
                    id="name"
                    placeholder="Rahul Sharma"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roll">Roll Number</Label>
                  <Input
                    id="roll"
                    placeholder="2024001"
                    value={newStudent.roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    placeholder="10th"
                    value={newStudent.class_name}
                    onChange={(e) => setNewStudent({ ...newStudent, class_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="A"
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                  />
                </div>
              </div>
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">Parent & Contact Details</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent Name</Label>
                    <Input
                      id="parentName"
                      placeholder="Mr. Vijay Sharma"
                      value={newStudent.parent_name}
                      onChange={(e) => setNewStudent({ ...newStudent, parent_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Phone</Label>
                      <Input
                        id="parentPhone"
                        placeholder="9876543210"
                        value={newStudent.parent_phone}
                        onChange={(e) => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        placeholder="parent@email.com"
                        value={newStudent.parent_email}
                        onChange={(e) => setNewStudent({ ...newStudent, parent_email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123, Main Street, City"
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">Guardian Details (if different from parent)</p>
                <div className="space-y-2">
                  <Label htmlFor="guardian">Guardian Name & Relation</Label>
                  <Input
                    id="guardian"
                    placeholder="Mr. Ramesh Sharma (Uncle)"
                    value={newStudent.guardian}
                    onChange={(e) => setNewStudent({ ...newStudent, guardian: e.target.value })}
                  />
                </div>
              </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStudent} disabled={createStudent.isPending}>
                {createStudent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map((className) => (
              <SelectItem key={className} value={className as string}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students list */}
      <Card className="mt-6 card-elevated">
        {isLoading ? (
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        ) : filteredStudents?.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "No students found" : "No students yet"}
            description={searchQuery ? "Try a different search term" : "Add your first student to get started"}
            action={
              !searchQuery && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Parent Link</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        {student.roll_number && (
                          <p className="text-sm text-muted-foreground">Roll: {student.roll_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.class_name && (
                        <Badge variant="secondary">
                          {student.class_name}{student.section && `-${student.section}`}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{student.parent_name || "—"}</p>
                        <p className="text-muted-foreground">{student.parent_phone || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {studentFeeCountMap.get(student.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFeeManagerStudent(student)}
                            className="border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/50"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                            <span className="text-green-700 dark:text-green-400">
                              Fees ({studentFeeCountMap.get(student.id)})
                            </span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFeeManagerStudent(student)}
                          >
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Fees
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentRecorderStudent(student)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Payments
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditStudent(student)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyParentLink(student)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link to={`/view/${student.access_token}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Fee Manager Dialog */}
      {feeManagerStudent && (
        <StudentFeeManager
          student={feeManagerStudent}
          open={!!feeManagerStudent}
          onOpenChange={(open) => !open && setFeeManagerStudent(null)}
        />
      )}

      {/* Payment Recorder Dialog */}
      {paymentRecorderStudent && (
        <PaymentRecorder
          student={paymentRecorderStudent}
          open={!!paymentRecorderStudent}
          onOpenChange={(open) => !open && setPaymentRecorderStudent(null)}
        />
      )}

      {/* Edit Student Dialog */}
      <EditStudentDialog
        student={editStudent}
        open={!!editStudent}
        onOpenChange={(open) => !open && setEditStudent(null)}
      />
    </AdminLayout>
  );
}