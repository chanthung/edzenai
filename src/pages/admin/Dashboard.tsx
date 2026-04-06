import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStudents } from "@/hooks/useStudents";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useFeeCategories } from "@/hooks/useFeeCategories";
import { useSchool } from "@/hooks/useSchool";
import { useFeeReports } from "@/hooks/useFeeReports";
import { usePendingPaymentProofs } from "@/hooks/usePaymentProofs";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { formatCurrency } from "@/lib/format";
import { Users, CalendarDays, Receipt, ArrowRight, CheckCircle2, Clock, BarChart3, FileCheck, Lock, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { FeesSummaryCards } from "@/components/admin/reports/FeesSummaryCards";
import { BirthdayReminder } from "@/components/admin/BirthdayReminder";
import { ClassWiseReport } from "@/components/admin/reports/ClassWiseReport";
import { StudentPendingReport } from "@/components/admin/reports/StudentPendingReport";
import { MonthWiseCollectionReport } from "@/components/admin/reports/MonthWiseCollectionReport";
import { PendingProofsPanel } from "@/components/admin/PendingProofsPanel";
import { TrialBanner } from "@/components/admin/TrialBanner";
import { Badge } from "@/components/ui/badge";
import { exportMultiSheetXLSX } from "@/lib/export-utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: academicYears, isLoading: yearsLoading } = useAcademicYears();
  const { data: feeCategories, isLoading: categoriesLoading } = useFeeCategories();
  const { data: school } = useSchool();
  const { data: feeReports, isLoading: reportsLoading } = useFeeReports();
  const { data: pendingProofs } = usePendingPaymentProofs(school?.id);
  const { isRestricted } = useSubscriptionStatus();

  // Redirect to onboarding if not completed and no students
  useEffect(() => {
    if (school && !(school as any).onboarding_completed && (!students || students.length === 0) && !studentsLoading) {
      navigate("/admin/getting-started", { replace: true });
    }
  }, [school, students, studentsLoading, navigate]);

  const activeYear = academicYears?.find(y => y.is_active) ?? academicYears?.[0];
  const isSetupComplete = students && students.length > 0 && academicYears && academicYears.length > 0;
  const pendingProofsCount = pendingProofs?.length || 0;

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description={`Welcome to ${school?.name || 'your school'} fee management`}
      />

      <div className="mt-4">
        <TrialBanner />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proofs" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Payment Proofs
            {pendingProofsCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {pendingProofsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Fee Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick stats */}
          <div className="grid gap-4 md:grid-cols-4 stagger-children">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
                <div className="p-2 rounded-xl bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold tracking-tight">{students?.length || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Year
                </CardTitle>
                <div className="p-2 rounded-xl bg-primary/10">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {yearsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold tracking-tight">{activeYear?.name || "Not set"}</div>
                )}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fee Categories
                </CardTitle>
                <div className="p-2 rounded-xl bg-[hsl(var(--status-paid)/.1)]">
                  <Receipt className="h-4 w-4 text-[hsl(var(--status-paid))]" />
                </div>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold tracking-tight">{feeCategories?.length || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card className={`card-elevated ${pendingProofsCount > 0 ? 'border-[hsl(var(--status-due)/.4)]' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Proofs
                </CardTitle>
                <div className={`p-2 rounded-xl ${pendingProofsCount > 0 ? 'bg-[hsl(var(--status-due)/.1)]' : 'bg-muted'}`}>
                  <FileCheck className={`h-4 w-4 ${pendingProofsCount > 0 ? 'text-[hsl(var(--status-due))]' : 'text-muted-foreground'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold tracking-tight ${pendingProofsCount > 0 ? 'text-[hsl(var(--status-due))]' : ''}`}>
                  {pendingProofsCount}
                </div>
                {pendingProofsCount > 0 && (
                  <p className="text-xs text-[hsl(var(--status-due))] mt-1">Requires review</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending proofs alert */}
          {pendingProofsCount > 0 && (
            <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <FileCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {pendingProofsCount} payment proof{pendingProofsCount !== 1 ? 's' : ''} awaiting verification
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Parents have submitted payment proofs that need your review
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link to="#" onClick={() => document.querySelector('[value="proofs"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>
                      Review Proofs
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Setup checklist for new schools */}
          {!isSetupComplete && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Getting Started
                </CardTitle>
                <CardDescription>
                  Complete these steps to start sharing fee information with parents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <SetupItem 
                    title="Add students" 
                    description="Add student records with parent contact info"
                    completed={students && students.length > 0}
                    href="/admin/students"
                  />
                  <SetupItem 
                    title="Create academic year" 
                    description="Set up the current academic year"
                    completed={academicYears && academicYears.length > 0}
                    href="/admin/academic-years"
                  />
                  <SetupItem 
                    title="Configure fee structure" 
                    description="Define fees and installment schedule"
                    completed={feeCategories && feeCategories.length > 0}
                    href="/admin/fee-setup"
                  />
                  <SetupItem 
                    title="Set up payment QR code" 
                    description="Add your UPI ID for easy payments"
                    completed={!!school?.upi_id}
                    href="/admin/settings"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Birthday Reminder */}
          {students && students.length > 0 && (
            <BirthdayReminder students={students} />
          )}

          {/* Quick actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Quick Actions
                  {isRestricted && (
                    <Badge variant="outline" className="text-xs font-normal text-amber-600 border-amber-300">
                      <Lock className="h-3 w-3 mr-1" />
                      View Only
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          asChild={!isRestricted} 
                          variant="outline" 
                          className={`w-full justify-between ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isRestricted}
                        >
                          {isRestricted ? (
                            <span className="flex items-center justify-between w-full">
                              Add New Student
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </span>
                          ) : (
                            <Link to="/admin/students">
                              Add New Student
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {isRestricted && (
                      <TooltipContent>
                        <p>School is inactive. Adding students is disabled.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/fee-setup">
                    {isRestricted ? 'View Fee Structure' : 'Manage Fee Structure'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/settings">
                    {isRestricted ? 'View Settings' : 'School Settings'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Collection Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : feeReports && (feeReports.totalCollected > 0 || feeReports.totalPending > 0) ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Collected</span>
                      <span className="font-semibold text-status-paid">{formatCurrency(feeReports.totalCollected)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="font-semibold text-destructive">{formatCurrency(feeReports.totalPending)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(feeReports.collectionRate, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.min(feeReports.collectionRate, 100).toFixed(1)}% collection rate • {feeReports.studentsWithPending} student{feeReports.studentsWithPending !== 1 ? 's' : ''} with pending fees
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">No fee data yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Set up fee structures to see collection stats</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="proofs" className="mt-6">
          <PendingProofsPanel schoolId={school?.id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          {/* Export button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!feeReports) return;
                const classSheet = feeReports.classWiseReports.map(r => ({
                  'Class': r.className,
                  'Total Students': r.totalStudents,
                  'Students with Pending': r.studentsWithPending,
                  'Total Fees': r.totalFees,
                  'Collected': r.collectedFees,
                  'Pending': r.pendingFees,
                  'Collection Rate (%)': r.collectionRate,
                }));
                const studentSheet = feeReports.studentReports.map(r => ({
                  'Student Name': r.studentName,
                  'Class': r.className || '',
                  'Section': r.section || '',
                  'Roll No': r.rollNumber || '',
                  'Total Fees': r.totalFees,
                  'Paid': r.paidAmount,
                  'Pending': r.pendingAmount,
                  'Status': r.status,
                }));
                exportMultiSheetXLSX([
                  { name: 'Class-wise Report', data: classSheet },
                  { name: 'Student-wise Report', data: studentSheet },
                ], `fee_report_${new Date().toISOString().slice(0, 10)}`);
              }}
              disabled={reportsLoading || !feeReports}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Fee Reports
            </Button>
          </div>

          {/* Fee Summary Cards */}
          <FeesSummaryCards
            isLoading={reportsLoading}
            totalStudents={feeReports?.totalStudents || 0}
            studentsWithPending={feeReports?.studentsWithPending || 0}
            totalCollected={feeReports?.totalCollected || 0}
            totalPending={feeReports?.totalPending || 0}
            collectionRate={feeReports?.collectionRate || 0}
            totalCollectedThisMonth={feeReports?.totalCollectedThisMonth || 0}
          />

          {/* Month-wise Collection Report */}
          <MonthWiseCollectionReport />

          {/* Class-wise Report */}
          <ClassWiseReport
            data={feeReports?.classWiseReports || []}
            isLoading={reportsLoading}
          />

          {/* Student-wise Pending Report */}
          <StudentPendingReport
            data={feeReports?.studentReports || []}
            isLoading={reportsLoading}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function SetupItem({ 
  title, 
  description, 
  completed, 
  href 
}: { 
  title: string; 
  description: string; 
  completed: boolean; 
  href: string;
}) {
  return (
    <Link to={href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        completed ? 'bg-status-paid/20 text-status-paid' : 'bg-muted text-muted-foreground'
      }`}>
        {completed ? <CheckCircle2 className="h-5 w-5" /> : <div className="w-3 h-3 rounded-full bg-current" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${completed ? 'text-muted-foreground line-through' : ''}`}>{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
