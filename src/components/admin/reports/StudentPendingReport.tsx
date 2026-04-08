import { useState, useMemo } from "react";
import { sortClassNames } from "@/lib/class-sort";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { StudentFeeReport } from "@/hooks/useFeeReports";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StudentPendingReportProps {
  data: StudentFeeReport[];
  isLoading: boolean;
}

export function StudentPendingReport({ data, isLoading }: StudentPendingReportProps) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendTotal, setSendTotal] = useState(0);

  const classes = useMemo(() => {
    const uniqueClasses = new Set(data.map(s => s.className || 'Unassigned'));
    return sortClassNames(Array.from(uniqueClasses));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(student => {
      const searchMatch = search === "" || 
        student.studentName.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(search.toLowerCase());

      const classMatch = classFilter === "all" || 
        (student.className || 'Unassigned') === classFilter;

      let statusMatch = true;
      if (statusFilter === "pending") {
        statusMatch = student.pendingAmount > 0;
      } else if (statusFilter === "paid") {
        statusMatch = student.status === 'paid';
      } else if (statusFilter === "partial") {
        statusMatch = student.status === 'partial';
      }

      return searchMatch && classMatch && statusMatch;
    });
  }, [data, search, classFilter, statusFilter]);

  const shareableStudents = useMemo(() => {
    return filteredData.filter(s => selectedIds.has(s.studentId) && s.parentPhone?.trim());
  }, [filteredData, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(s => s.studentId)));
    }
  };

  const handleBulkShare = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setSendProgress(0);
    setSendTotal(shareableStudents.length);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < shareableStudents.length; i++) {
      const student = shareableStudents[i];
      try {
        const { error } = await supabase.functions.invoke('send-parent-link', {
          body: { studentId: student.studentId },
        });
        if (error) {
          failCount++;
          console.warn(`Failed for ${student.studentName}:`, error);
        } else {
          successCount++;
        }
      } catch {
        failCount++;
      }
      setSendProgress(i + 1);
      if (i < shareableStudents.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsSending(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      toast.success(`Parent link sent to ${successCount} parent(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send to ${failCount} parent(s)`);
    }
  };

  const getStatusBadge = (status: 'paid' | 'partial' | 'unpaid') => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-status-paid/20 text-status-paid border-status-paid/30">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-status-partial/20 text-status-partial border-status-partial/30">Partial</Badge>;
      case 'unpaid':
        return <Badge className="bg-status-overdue/20 text-status-overdue border-status-overdue/30">Unpaid</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Student-wise Fee Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student-wise Fee Report</CardTitle>
              <CardDescription>
                {filteredData.length} students 
                {statusFilter === "pending" && " with pending fees"}
                {statusFilter === "paid" && " with fees fully paid"}
                {statusFilter === "partial" && " with partial payments"}
              </CardDescription>
            </div>
            {selectedIds.size > 0 && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isSending || shareableStudents.length === 0}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Share via WhatsApp ({shareableStudents.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSending && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>Sending parent links...</span>
                <span>{sendProgress} / {sendTotal}</span>
              </div>
              <Progress value={(sendProgress / sendTotal) * 100} className="h-2" />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">With Pending</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total Fees</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(student.studentId)}
                        onCheckedChange={() => toggleSelect(student.studentId)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{student.studentName}</span>
                        {student.rollNumber && (
                          <span className="text-xs text-muted-foreground">
                            Roll: {student.rollNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{student.className || 'N/A'}</span>
                        {student.section && (
                          <span className="text-xs text-muted-foreground">
                            Section {student.section}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(student.totalFees)}
                    </TableCell>
                    <TableCell className="text-right text-status-paid">
                      {formatCurrency(student.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right text-status-overdue font-medium">
                      {student.pendingAmount > 0 ? formatCurrency(student.pendingAmount) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(student.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No students found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Parent Links via WhatsApp</DialogTitle>
            <DialogDescription>
              {shareableStudents.length} student(s) with valid phone numbers will receive their parent portal link.
              {selectedIds.size - shareableStudents.length > 0 && (
                <span className="block mt-1 text-destructive">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  {selectedIds.size - shareableStudents.length} student(s) skipped (no phone number)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {shareableStudents.map(s => (
              <div key={s.studentId} className="flex items-center gap-2 text-sm py-1">
                <CheckCircle2 className="h-3 w-3 text-status-paid" />
                <span>{s.studentName}</span>
                <span className="text-muted-foreground ml-auto">{s.parentPhone}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkShare} className="gap-2">
              <Send className="h-4 w-4" />
              Send to {shareableStudents.length} parents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
