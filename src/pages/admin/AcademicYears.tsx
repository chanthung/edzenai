import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentAcademicYearContext, useAcademicYears, useCreateAcademicYear, useUpdateAcademicYear, useDeleteAcademicYear } from "@/hooks/useAcademicYears";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSchool } from "@/hooks/useSchool";
import { RestrictedButton } from "@/components/admin/RestrictedOverlay";
import { PromoteStudentsTab } from "@/components/admin/PromoteStudentsTab";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, CalendarDays, Trash2, Loader2, GraduationCap, AlertTriangle } from "lucide-react";

export default function AcademicYears() {
  const { data: academicYears, isLoading } = useAcademicYears();
  const createYear = useCreateAcademicYear();
  const updateYear = useUpdateAcademicYear();
  const deleteYear = useDeleteAcademicYear();
  const { isRestricted } = useSubscriptionStatus();
  const { data: school } = useSchool();
  const currentCtx = useCurrentAcademicYearContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const handleCreateYear = async () => {
    if (!newYear.name.trim() || !newYear.start_date || !newYear.end_date) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createYear.mutateAsync(newYear);
      toast.success("Academic year created");
      setDialogOpen(false);
      setNewYear({ name: "", start_date: "", end_date: "", is_active: true });
    } catch (error: any) {
      toast.error("Failed to create academic year", { description: error.message });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (isRestricted) {
      toast.error("Operation not permitted", { description: "School is in restricted mode." });
      return;
    }
    try {
      await updateYear.mutateAsync({ id, is_active: isActive });
      toast.success(isActive ? "Year activated — other years were set inactive" : "Year deactivated");
    } catch (error: any) {
      toast.error("Failed to update", { description: error.message });
    }
  };

  const handleDeleteYear = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also delete all fee structures for this year.`)) return;
    try {
      await deleteYear.mutateAsync(id);
      toast.success("Academic year deleted");
    } catch (error: any) {
      toast.error("Failed to delete", { description: error.message });
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Academic Years" description="Manage academic years, fee structures, and student promotions">
        <RestrictedButton isRestricted={isRestricted}>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isRestricted}>
                <Plus className="h-4 w-4 mr-2" />
                New Year
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Academic Year</DialogTitle>
                <DialogDescription>Add a new academic year for fee management</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="yearName">Year Name</Label>
                  <Input
                    id="yearName"
                    placeholder="2025-26"
                    value={newYear.name}
                    onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" value={newYear.start_date} onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" value={newYear.end_date} onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label htmlFor="isActive">Set as current year</Label>
                    <p className="text-sm text-muted-foreground">Only one year can be current; the previous one becomes inactive</p>
                  </div>
                  <Switch id="isActive" checked={newYear.is_active} onCheckedChange={(checked) => setNewYear({ ...newYear, is_active: checked })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateYear} disabled={createYear.isPending}>
                  {createYear.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Year
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RestrictedButton>
      </PageHeader>

      <Tabs defaultValue="years" className="mt-6">
        <TabsList>
          <TabsTrigger value="years">
            <CalendarDays className="h-4 w-4 mr-2" />
            Academic Years
          </TabsTrigger>
          <TabsTrigger value="promotions" disabled={(academicYears?.length ?? 0) < 2}>
            <GraduationCap className="h-4 w-4 mr-2" />
            Promotions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="years" className="mt-4">
          {currentCtx.warning && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{currentCtx.warning}</span>
            </div>
          )}
          <div className="grid gap-4">
            {isLoading ? (
              [1, 2].map((i) => (
                <Card key={i} className="card-elevated">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : academicYears?.length === 0 ? (
              <Card className="card-elevated">
                <EmptyState
                  icon={CalendarDays}
                  title="No academic years"
                  description="Create your first academic year to start managing fees"
                  action={
                    !isRestricted && (
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Year
                      </Button>
                    )
                  }
                />
              </Card>
            ) : (
              academicYears?.map((year) => (
                <Card key={year.id} className="card-elevated">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{year.name}</h3>
                            {year.is_active && (
                              <Badge className="bg-status-paid/20 text-status-paid border-status-paid/20">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(year.start_date)} — {formatDate(year.end_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${year.id}`} className="text-sm text-muted-foreground">Active</Label>
                          <Switch
                            id={`active-${year.id}`}
                            checked={year.is_active}
                            onCheckedChange={(checked) => handleToggleActive(year.id, checked)}
                            disabled={isRestricted}
                          />
                        </div>
                        <RestrictedButton isRestricted={isRestricted}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => !isRestricted && handleDeleteYear(year.id, year.name)}
                            disabled={isRestricted}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </RestrictedButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="mt-4">
          {school && academicYears && (
            <PromoteStudentsTab academicYears={academicYears} schoolId={school.id} />
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
