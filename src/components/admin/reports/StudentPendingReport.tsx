import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { StudentFeeReport } from "@/hooks/useFeeReports";
import { Search, Filter } from "lucide-react";

interface StudentPendingReportProps {
  data: StudentFeeReport[];
  isLoading: boolean;
}

export function StudentPendingReport({ data, isLoading }: StudentPendingReportProps) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const classes = useMemo(() => {
    const uniqueClasses = new Set(data.map(s => s.className || 'Unassigned'));
    return Array.from(uniqueClasses).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(student => {
      // Search filter
      const searchMatch = search === "" || 
        student.studentName.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(search.toLowerCase());

      // Class filter
      const classMatch = classFilter === "all" || 
        (student.className || 'Unassigned') === classFilter;

      // Status filter
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
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle>Student-wise Fee Report</CardTitle>
        <CardDescription>
          {filteredData.length} students 
          {statusFilter === "pending" && " with pending fees"}
          {statusFilter === "paid" && " with fees fully paid"}
          {statusFilter === "partial" && " with partial payments"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No students found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
