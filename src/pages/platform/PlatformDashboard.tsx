import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2, Users, LogOut, Shield, Pencil, Zap, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CreateSchoolDialog } from "@/components/platform/CreateSchoolDialog";
import { EditSchoolDialog } from "@/components/platform/EditSchoolDialog";
import { ActivateSchoolDialog } from "@/components/platform/ActivateSchoolDialog";
import { SystemStateBadge } from "@/components/ui/system-state-badge";
import { format, differenceInDays } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type School = Tables<"schools">;

function calculateEffectiveState(school: School): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (school.payment_verified === true && school.system_state === 'subscription_active') {
    return 'subscription_active';
  }
  
  if (!school.trial_end_date) {
    return 'trial_active';
  }
  
  const trialEnd = new Date(school.trial_end_date);
  trialEnd.setHours(0, 0, 0, 0);
  
  if (today <= trialEnd) {
    return 'trial_active';
  }
  
  return 'trial_expired';
}

function getDaysRemaining(trialEndDate: string | null): number | null {
  if (!trialEndDate) return null;
  return differenceInDays(new Date(trialEndDate), new Date());
}

export default function PlatformDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [activatingSchool, setActivatingSchool] = useState<School | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      checkPlatformAdmin();
    }
  }, [user, authLoading, navigate]);

  const checkPlatformAdmin = async () => {
    const { data, error } = await supabase.rpc('is_platform_admin');
    
    if (error) {
      console.error("Error checking platform admin status:", error);
      setIsPlatformAdmin(false);
      setLoading(false);
      return;
    }

    setIsPlatformAdmin(data);

    if (data) {
      fetchSchools();
    } else {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching schools:", error);
      toast.error("Failed to load schools");
    } else {
      setSchools(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Calculate stats
  const activeSchools = schools.filter(s => calculateEffectiveState(s) === 'subscription_active').length;
  const trialSchools = schools.filter(s => calculateEffectiveState(s) === 'trial_active').length;
  const expiredSchools = schools.filter(s => calculateEffectiveState(s) === 'trial_expired').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have platform admin privileges. Please contact an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Platform Admin</h1>
              <p className="text-sm text-muted-foreground">Manage schools and administrators</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schools.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeSchools}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Trial</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{trialSchools}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expired/Restricted</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiredSchools}</div>
            </CardContent>
          </Card>
        </div>

        {/* Schools table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Schools</CardTitle>
              <CardDescription>Manage all registered schools</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </CardHeader>
          <CardContent>
            {schools.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No schools yet</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first school</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add School
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Trial End</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => {
                      const effectiveState = calculateEffectiveState(school);
                      const daysRemaining = getDaysRemaining(school.trial_end_date);
                      const needsActivation = effectiveState === 'trial_expired';
                      const plan = (school as any).subscription_plan || 'starter';

                      return (
                        <TableRow key={school.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{school.name}</p>
                              <p className="text-xs text-muted-foreground">{school.email || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              plan === 'pro'
                                ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            }>
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {school.trial_end_date 
                              ? format(new Date(school.trial_end_date), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <SystemStateBadge state={effectiveState} size="sm" />
                          </TableCell>
                          <TableCell>
                            {daysRemaining !== null ? (
                              <span className={daysRemaining <= 0 ? 'text-destructive font-medium' : daysRemaining <= 7 ? 'text-amber-600 font-medium' : ''}>
                                {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days`}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(school.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSchool(school)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {needsActivation && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setActivatingSchool(school)}
                                >
                                  <Zap className="h-4 w-4 mr-1" />
                                  Activate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateSchoolDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchSchools}
      />

      <EditSchoolDialog
        school={editingSchool}
        open={!!editingSchool}
        onOpenChange={(open) => !open && setEditingSchool(null)}
        onSuccess={fetchSchools}
      />

      <ActivateSchoolDialog
        school={activatingSchool}
        open={!!activatingSchool}
        onOpenChange={(open) => !open && setActivatingSchool(null)}
        onSuccess={fetchSchools}
      />
    </div>
  );
}
