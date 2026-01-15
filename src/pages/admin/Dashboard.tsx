import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudents } from "@/hooks/useStudents";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useFeeCategories } from "@/hooks/useFeeCategories";
import { useSchool } from "@/hooks/useSchool";
import { useFeeReports } from "@/hooks/useFeeReports";
import { formatCurrency } from "@/lib/format";
import { Users, CalendarDays, Receipt, ArrowRight, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { FeesSummaryCards } from "@/components/admin/reports/FeesSummaryCards";
import { ClassWiseReport } from "@/components/admin/reports/ClassWiseReport";
import { StudentPendingReport } from "@/components/admin/reports/StudentPendingReport";

export default function Dashboard() {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: academicYears, isLoading: yearsLoading } = useAcademicYears();
  const { data: feeCategories, isLoading: categoriesLoading } = useFeeCategories();
  const { data: school } = useSchool();
  const { data: feeReports, isLoading: reportsLoading } = useFeeReports();

  const activeYear = academicYears?.find(y => y.is_active) ?? academicYears?.[0];
  const isSetupComplete = students && students.length > 0 && academicYears && academicYears.length > 0;

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description={`Welcome to ${school?.name || 'your school'} fee management`}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Fee Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick stats */}
          <div className="grid gap-4 md:grid-cols-3 stagger-children">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{students?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Year
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {yearsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{activeYear?.name || "Not set"}</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fee Categories
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{feeCategories?.length || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

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
                completed={false}
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

          {/* Quick actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/students">
                    Add New Student
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/fee-setup">
                    Manage Fee Structure
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/settings">
                    School Settings
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Activity feed will appear here as you record payments and add students.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          {/* Fee Summary Cards */}
          <FeesSummaryCards
            isLoading={reportsLoading}
            totalStudents={feeReports?.totalStudents || 0}
            studentsWithPending={feeReports?.studentsWithPending || 0}
            totalCollected={feeReports?.totalCollected || 0}
            totalPending={feeReports?.totalPending || 0}
            collectionRate={feeReports?.collectionRate || 0}
          />

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
