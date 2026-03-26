import { useState, useMemo, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BulkStudentUpload } from "@/components/admin/BulkStudentUpload";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStudents, useCreateStudent, useDeleteStudent, Student } from "@/hooks/useStudents";
import { useStudentFees } from "@/hooks/useStudentFees";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useAcademicYears, useActiveAcademicYear } from "@/hooks/useAcademicYears";
import { StudentFeeManager } from "@/components/admin/StudentFeeManager";
import { PaymentRecorder } from "@/components/admin/PaymentRecorder";
import { EditStudentDialog } from "@/components/admin/EditStudentDialog";
import { RestrictedButton } from "@/components/admin/RestrictedOverlay";
import { SiblingIndicator } from "@/components/admin/SiblingIndicator";
import { toast } from "sonner";
import { Plus, Users, Copy, ExternalLink, Trash2, Search, Loader2, IndianRupee, CreditCard, CheckCircle2, Pencil, Share2, Send, FileSpreadsheet, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToXLSX } from "@/lib/export-utils";

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function Students() {
  const { data: students, isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  const { data: academicYears } = useAcademicYears();
  const activeAcademicYear = useActiveAcademicYear();
  const queryClient = useQueryClient();

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
  const [shareStudent, setShareStudent] = useState<Student | null>(null);
  const [isSendingLink, setIsSendingLink] = useState<string | null>(null);
  
  // Multi-select state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkShareDialogOpen, setBulkShareDialogOpen] = useState(false);
  const [bulkSendProgress, setBulkSendProgress] = useState({ current: 0, total: 0 });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  
  
  const [newStudent, setNewStudent] = useState({
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

  // Pre-select active academic year when dialog opens
  useEffect(() => {
    if (activeAcademicYear && dialogOpen) {
      setNewStudent(prev => ({ 
        ...prev, 
        academic_year_id: activeAcademicYear.id 
      }));
    }
  }, [activeAcademicYear, dialogOpen]);

  // Get unique classes for filter dropdown
  const uniqueClasses = useMemo(() => {
    if (!students) return [];
    const classes = new Set(students.map(s => s.class_name).filter(Boolean));
    return Array.from(classes).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const filtered = students?.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClass = classFilter === "all" || student.class_name === classFilter;
      
      return matchesSearch && matchesClass;
    });

    // Sort by class (numeric extraction), then section, then name
    return filtered?.sort((a, b) => {
      const classA = a.class_name || '';
      const classB = b.class_name || '';
      const numA = parseInt((classA.match(/(\d+)/) || ['0', '0'])[1], 10);
      const numB = parseInt((classB.match(/(\d+)/) || ['0', '0'])[1], 10);
      if (numA !== numB) return numA - numB;
      // Same numeric class — compare full class string for non-numeric classes
      if (classA.localeCompare(classB) !== 0) return classA.localeCompare(classB);
      // Then section
      const secA = (a.section || '').toLowerCase();
      const secB = (b.section || '').toLowerCase();
      if (secA !== secB) return secA.localeCompare(secB);
      // Then name alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [students, searchQuery, classFilter]);

  // Get selected students that have valid phone numbers for sharing
  const selectedShareableStudents = useMemo(() => {
    if (!filteredStudents) return [];
    return filteredStudents.filter(
      student => selectedStudents.has(student.id) && student.parent_phone
    );
  }, [selectedStudents, filteredStudents]);

  // Toggle single student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Toggle all visible students
  const toggleSelectAll = () => {
    if (!filteredStudents) return;
    
    const allVisibleIds = filteredStudents.map(s => s.id);
    const allSelected = allVisibleIds.every(id => selectedStudents.has(id));
    
    if (allSelected) {
      // Deselect all visible
      setSelectedStudents(prev => {
        const next = new Set(prev);
        allVisibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedStudents(prev => {
        const next = new Set(prev);
        allVisibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Check if all visible students are selected
  const allVisibleSelected = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0) return false;
    return filteredStudents.every(s => selectedStudents.has(s.id));
  }, [filteredStudents, selectedStudents]);

  // Check if some (but not all) visible students are selected
  const someVisibleSelected = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0) return false;
    const selectedCount = filteredStudents.filter(s => selectedStudents.has(s.id)).length;
    return selectedCount > 0 && selectedCount < filteredStudents.length;
  }, [filteredStudents, selectedStudents]);

  const handleCreateStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error("Student name is required");
      return;
    }

    if (!newStudent.parent_phone.trim()) {
      toast.error("Parent phone number is required");
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
        academic_year_id: activeAcademicYear?.id || "",
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
    const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const link = `${window.location.origin}/view/${firstName}/${student.access_token}`;
    navigator.clipboard.writeText(link);
    toast.success("Parent link copied!", { description: "Share this link with the parent" });
  };

  // Ref guard to prevent duplicate sends
  const sendingRef = useRef(false);

  const handleShareLink = async (student: Student) => {
    // Prevent duplicate sends using ref guard
    if (sendingRef.current) {
      console.log('Duplicate send blocked for student:', student.id);
      return;
    }
    
    sendingRef.current = true;
    setShareStudent(null);
    setIsSendingLink(student.id);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Please log in to send links");
        return;
      }

      const response = await supabase.functions.invoke('send-parent-link', {
        body: { studentId: student.id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send link');
      }

      const data = response.data;
      if (data.success) {
        toast.success("Link sent!", { 
          description: `Parent link sent to ${student.parent_phone}` 
        });
      } else {
        throw new Error(data.error || 'Failed to send link');
      }
    } catch (error: any) {
      console.error('Share link error:', error);
      toast.error("Failed to send link", { 
        description: error.message || "Please try again later" 
      });
    } finally {
      setIsSendingLink(null);
      sendingRef.current = false;
    }
  };

  // Handle bulk share action
  const handleBulkShare = async () => {
    if (selectedShareableStudents.length === 0) return;
    
    setBulkShareDialogOpen(false);
    setIsBulkSending(true);
    setBulkSendProgress({ current: 0, total: selectedShareableStudents.length });
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Please log in to send links");
        setIsBulkSending(false);
        return;
      }

      for (let i = 0; i < selectedShareableStudents.length; i++) {
        const student = selectedShareableStudents[i];
        setBulkSendProgress({ current: i + 1, total: selectedShareableStudents.length });
        
        try {
          const response = await supabase.functions.invoke('send-parent-link', {
            body: { studentId: student.id },
          });

          if (response.error || !response.data?.success) {
            failCount++;
          } else {
            successCount++;
          }
        } catch {
          failCount++;
        }
        
        // Small delay between requests to avoid overwhelming the system
        if (i < selectedShareableStudents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Show final result
      if (failCount === 0) {
        toast.success(`Sent ${successCount} links successfully!`);
      } else if (successCount === 0) {
        toast.error(`Failed to send all ${failCount} links`);
      } else {
        toast.info(`Sent ${successCount} links, ${failCount} failed`);
      }
      
      // Clear selection after successful bulk send
      setSelectedStudents(new Set());
    } finally {
      setIsBulkSending(false);
      setBulkSendProgress({ current: 0, total: 0 });
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Students" description="Manage student records and parent access links">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!filteredStudents?.length) return;
              const rows = filteredStudents.map(s => ({
                'Name': s.name,
                'Roll Number': s.roll_number || '',
                'Class': s.class_name || '',
                'Section': s.section || '',
                'Parent Name': s.parent_name || '',
                'Parent Phone': s.parent_phone || '',
                'Parent Email': s.parent_email || '',
                'Guardian': s.guardian || '',
                'Address': s.address || '',
              }));
              exportToXLSX(rows, { filename: `students_${classFilter !== 'all' ? classFilter + '_' : ''}${new Date().toISOString().slice(0, 10)}`, sheetName: 'Students' });
              toast.success(`Exported ${rows.length} students`);
            }}
            disabled={!filteredStudents?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <RestrictedButton isRestricted={isRestricted}>
            <Button variant="outline" disabled={isRestricted} onClick={() => setBulkUploadOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import via Excel (AI)
            </Button>
          </RestrictedButton>
          <RestrictedButton isRestricted={isRestricted}>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isRestricted}>
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
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year *</Label>
                  <Select
                    value={newStudent.academic_year_id}
                    onValueChange={(value) => setNewStudent({ ...newStudent, academic_year_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears?.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name} {year.is_active && "(Active)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <p className="text-sm font-medium mb-3">Personal Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={newStudent.gender}
                        onValueChange={(value) => setNewStudent({ ...newStudent, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={newStudent.date_of_birth}
                        onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                      />
                      {newStudent.date_of_birth && (
                        <p className="text-xs text-muted-foreground">
                          Age: {calculateAge(newStudent.date_of_birth)} years
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="social_category">Social Category</Label>
                      <Select
                        value={newStudent.social_category}
                        onValueChange={(value) => setNewStudent({ ...newStudent, social_category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
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
                      <Label htmlFor="religion">Religion</Label>
                      <Select
                        value={newStudent.religion}
                        onValueChange={(value) => setNewStudent({ ...newStudent, religion: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
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
                    <Label htmlFor="aadhaar">Aadhaar Number</Label>
                    <Input
                      id="aadhaar"
                      placeholder="123456789012"
                      maxLength={12}
                      value={newStudent.aadhaar_number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setNewStudent({ ...newStudent, aadhaar_number: val });
                      }}
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
                        <Label htmlFor="parentPhone">Phone *</Label>
                        <Input
                          id="parentPhone"
                          placeholder="9876543210"
                          value={newStudent.parent_phone}
                          onChange={(e) => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                          required
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
        </RestrictedButton>
        </div>
      </PageHeader>

      <BulkStudentUpload open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} />

      {/* Search, Filter, and Bulk Actions */}
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
        
        {/* Bulk Share Button */}
        {selectedStudents.size > 0 && (
          <Button
            onClick={() => setBulkShareDialogOpen(true)}
            disabled={selectedShareableStudents.length === 0 || isBulkSending}
            className="gap-2"
          >
            {isBulkSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending {bulkSendProgress.current}/{bulkSendProgress.total}...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share Selected ({selectedShareableStudents.length})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Bulk Send Progress */}
      {isBulkSending && (
        <div className="mt-4">
          <Progress value={(bulkSendProgress.current / bulkSendProgress.total) * 100} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">
            Sending link {bulkSendProgress.current} of {bulkSendProgress.total}...
          </p>
        </div>
      )}

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
              !searchQuery && !isRestricted && (
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
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all visible students"
                      className={someVisibleSelected ? "data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary/50" : ""}
                    />
                  </TableHead>
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
                  <TableRow key={student.id} data-state={selectedStudents.has(student.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                        aria-label={`Select ${student.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{student.name}</p>
                          <SiblingIndicator student={student} allStudents={students || []} />
                        </div>
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
                        <RestrictedButton isRestricted={isRestricted}>
                          {studentFeeCountMap.get(student.id) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => !isRestricted && setFeeManagerStudent(student)}
                              disabled={isRestricted}
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
                              onClick={() => !isRestricted && setFeeManagerStudent(student)}
                              disabled={isRestricted}
                            >
                              <IndianRupee className="h-4 w-4 mr-1" />
                              Fees
                            </Button>
                          )}
                        </RestrictedButton>
                        <RestrictedButton isRestricted={isRestricted}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => !isRestricted && setPaymentRecorderStudent(student)}
                            disabled={isRestricted}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Payments
                          </Button>
                        </RestrictedButton>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RestrictedButton isRestricted={isRestricted}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => !isRestricted && setEditStudent(student)}
                          disabled={isRestricted}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </RestrictedButton>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyParentLink(student)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShareStudent(student)}
                          disabled={!student.parent_phone || isSendingLink === student.id}
                          title={!student.parent_phone ? "Parent phone required" : "Share via Telegram"}
                          className={student.telegram_registered ? "hover:bg-[#0088cc]/10 hover:text-[#0088cc]" : ""}
                        >
                          {isSendingLink === student.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Share2 className="h-4 w-4 mr-1" />
                          )}
                          Share
                        </Button>
                        {student.telegram_registered && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center justify-center w-6 h-6">
                                  <Send className="h-4 w-4 text-[#0088cc]" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Registered on Telegram</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Open parent view"
                        >
                          <Link to={`/view/${student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}/${student.access_token}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RestrictedButton isRestricted={isRestricted}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => !isRestricted && handleDeleteStudent(student.id, student.name)}
                          disabled={isRestricted}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </RestrictedButton>
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
      {editStudent && (
        <EditStudentDialog
          student={editStudent}
          open={!!editStudent}
          onOpenChange={(open) => !open && setEditStudent(null)}
        />
      )}

      {/* Share Link Confirmation Dialog */}
      <AlertDialog open={!!shareStudent} onOpenChange={(open) => !open && setShareStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Parent Link</AlertDialogTitle>
            <AlertDialogDescription>
              {shareStudent && (
                <>
                  Send the fee details link to <strong>{shareStudent.parent_phone}</strong> for{" "}
                  <strong>{shareStudent.name}</strong>?
                  <br /><br />
                  The parent will receive a WhatsApp/SMS message with the secure link to view their child's fee details.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => shareStudent && handleShareLink(shareStudent)}>
              <Share2 className="h-4 w-4 mr-2" />
              Send Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Share Confirmation Dialog */}
      <AlertDialog open={bulkShareDialogOpen} onOpenChange={setBulkShareDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Links to {selectedShareableStudents.length} Parents</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">The following students' parents will receive their fee details link:</p>
                <ScrollArea className="h-[200px] rounded-md border p-3">
                  <ul className="space-y-2">
                    {selectedShareableStudents.map(student => (
                      <li key={student.id} className="flex justify-between text-sm">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-muted-foreground">{student.parent_phone}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                {selectedStudents.size > selectedShareableStudents.length && (
                  <p className="mt-3 text-sm text-amber-600">
                    Note: {selectedStudents.size - selectedShareableStudents.length} selected student(s) without phone numbers will be skipped.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Send All Links
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
