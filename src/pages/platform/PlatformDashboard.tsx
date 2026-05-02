import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Building2, Users, LogOut, Shield, Pencil, Zap, Clock, AlertTriangle, Settings2, IndianRupee, Search, FileText, CreditCard, Handshake, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CreateSchoolDialog } from "@/components/platform/CreateSchoolDialog";
import { EditSchoolDialog } from "@/components/platform/EditSchoolDialog";
import { ActivateSchoolDialog } from "@/components/platform/ActivateSchoolDialog";
import { InvoiceModal } from "@/components/platform/InvoiceModal";
import { RecordPaymentDialog } from "@/components/platform/RecordPaymentDialog";
import { SystemStateBadge } from "@/components/ui/system-state-badge";
import { DeleteSchoolDialog } from "@/components/platform/DeleteSchoolDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePartners } from "@/hooks/usePartners";
import { format, differenceInDays } from "date-fns";
import { useSubscriptionPricing, calculateMonthlyFee, getDefaultRate } from "@/hooks/useSubscriptionPricing";
import { useVolumeDiscounts, getApplicableDiscount } from "@/hooks/useVolumeDiscounts";
import type { Tables } from "@/integrations/supabase/types";

type School = Tables<"schools">;

function calculateEffectiveState(school: School): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (school.payment_verified === true && school.system_state === 'subscription_active') return 'subscription_active';
  if (!school.trial_end_date) return 'trial_active';
  const trialEnd = new Date(school.trial_end_date);
  trialEnd.setHours(0, 0, 0, 0);
  return today <= trialEnd ? 'trial_active' : 'trial_expired';
}

function getDaysRemaining(school: School): number | null {
  const state = calculateEffectiveState(school);
  if (state === 'subscription_active') {
    const d = (school as any).next_billing_date || school.subscription_renewal_date;
    return d ? differenceInDays(new Date(d), new Date()) : null;
  }
  return school.trial_end_date ? differenceInDays(new Date(school.trial_end_date), new Date()) : null;
}

interface InvoiceData {
  subtotal: number;
  volumeDiscountPercent: number;
  volumeDiscountAmount: number;
  annualDiscountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  studentCount: number;
  effectiveRate: number;
  plan: string;
  billingCycle: string;
}

export default function PlatformDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [activatingSchool, setActivatingSchool] = useState<School | null>(null);
  const [invoiceSchool, setInvoiceSchool] = useState<School | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [paymentSchool, setPaymentSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const { data: pricing } = useSubscriptionPricing();
  const { data: volumeTiers } = useVolumeDiscounts();
  const { data: allPartners = [] } = usePartners();

  // Build partner lookup map
  const partnerMap = useMemo(() => {
    const map: Record<string, string> = {};
    allPartners.forEach((p: any) => { map[p.id] = p.name; });
    return map;
  }, [allPartners]);

  // Collection this month
  const [collectionThisMonth, setCollectionThisMonth] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/login"); return; }
    if (user) checkPlatformAdmin();
  }, [user, authLoading, navigate]);

  const checkPlatformAdmin = async () => {
    const { data, error } = await supabase.rpc('is_platform_admin');
    if (error) { setIsPlatformAdmin(false); setLoading(false); return; }
    setIsPlatformAdmin(data);
    if (data) { fetchSchools(); fetchCollectionThisMonth(); } else { setLoading(false); }
  };

  const fetchSchools = async () => {
    const { data, error } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    if (error) { toast.error("Failed to load schools"); }
    else {
      setSchools(data || []);
      if (data && data.length > 0) fetchStudentCounts(data.map(s => s.id));
    }
    setLoading(false);
  };

  const fetchStudentCounts = async (schoolIds: string[]) => {
    const { data } = await supabase.from('students').select('school_id').in('school_id', schoolIds);
    const counts: Record<string, number> = {};
    (data || []).forEach((s) => { counts[s.school_id] = (counts[s.school_id] || 0) + 1; });
    setStudentCounts(counts);
  };

  const fetchCollectionThisMonth = async () => {
    const now = new Date();
    const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
    const { data } = await supabase.from('platform_payments' as any).select('amount').gte('payment_date', startOfMonth);
    const total = (data || []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    setCollectionThisMonth(total);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const getPricingForPlan = (plan: string) => {
    const p = pricing?.find((pr) => pr.plan === plan);
    return { perStudentFee: p?.per_student_fee ?? getDefaultRate(plan), baseFee: p?.base_monthly_fee ?? 0 };
  };

  const computeInvoiceData = (school: School): InvoiceData => {
    const plan = school.subscription_plan || 'starter';
    const count = studentCounts[school.id] || 0;
    const { perStudentFee } = getPricingForPlan(plan);
    const customRate = school.custom_per_student_fee;
    const effectiveRate = customRate ?? perStudentFee;
    const billingCycle = (school as any).billing_cycle || 'monthly';
    const multiplier = billingCycle === 'annual' ? 12 : 1;

    const subtotal = count * effectiveRate * multiplier;

    // Volume discount
    const volumeDiscountPercent = getApplicableDiscount(count, volumeTiers || []);
    const volumeDiscountAmount = subtotal * (volumeDiscountPercent / 100);
    const afterVolume = subtotal - volumeDiscountAmount;

    // Annual discount (10% if annual)
    const annualDiscountAmount = billingCycle === 'annual' ? afterVolume * 0.1 : 0;
    const taxableAmount = afterVolume - annualDiscountAmount;

    const cgst = taxableAmount * 0.09;
    const sgst = taxableAmount * 0.09;
    const totalAmount = taxableAmount + cgst + sgst;

    return { subtotal, volumeDiscountPercent, volumeDiscountAmount, annualDiscountAmount, taxableAmount, cgst, sgst, totalAmount, studentCount: count, effectiveRate, plan, billingCycle };
  };

  const openInvoice = (school: School) => {
    setInvoiceData(computeInvoiceData(school));
    setInvoiceSchool(school);
  };

  // Filtered schools
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const q = searchQuery.toLowerCase();
    return schools.filter(s => s.name.toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q));
  }, [schools, searchQuery]);

  // KPI calculations
  const totalStudents = Object.values(studentCounts).reduce((s, c) => s + c, 0);
  const activeSchools = schools.filter(s => calculateEffectiveState(s) === 'subscription_active').length;
  const trialSchools = schools.filter(s => calculateEffectiveState(s) === 'trial_active').length;
  const expiredSchools = schools.filter(s => calculateEffectiveState(s) === 'trial_expired').length;
  const overdueAmount = schools.reduce((s, sch) => s + (Number((sch as any).pending_amount) || 0), 0);

  // MRR: monthly schools at face value, annual schools / 12
  const mrr = schools.reduce((sum, school) => {
    const plan = school.subscription_plan || 'starter';
    const { perStudentFee, baseFee } = getPricingForPlan(plan);
    const count = studentCounts[school.id] || 0;
    const billing = calculateMonthlyFee(count, perStudentFee, baseFee, school.discount_percent || 0, school.custom_per_student_fee);
    const billingCycle = (school as any).billing_cycle || 'monthly';
    // For annual: the monthly fee is already "monthly equivalent", but if annual has discount, that's handled at invoice level
    return sum + billing.totalFee;
  }, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have platform admin privileges.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
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
              <p className="text-sm text-muted-foreground">Manage schools and subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/platform/partners")}>
              <Handshake className="mr-2 h-4 w-4" />Partners
            </Button>
            <Button variant="outline" onClick={() => navigate("/platform/subscription-settings")}>
              <Settings2 className="mr-2 h-4 w-4" />Subscription Settings
            </Button>
            <Button variant="ghost" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* KPI Cards — Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schools.length}</div>
              <p className="text-xs text-muted-foreground">{activeSchools} active · {trialSchools} trial · {expiredSchools} expired</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents.toLocaleString("en-IN")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">₹{mrr.toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Collection This Month</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">₹{collectionThisMonth.toLocaleString("en-IN")}</div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards — Row 2 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeSchools}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold tabular-nums ${overdueAmount > 0 ? 'text-destructive' : ''}`}>
                ₹{overdueAmount.toLocaleString("en-IN")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Trial / Expired</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className="text-blue-600">{trialSchools}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-orange-600">{expiredSchools}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Schools</CardTitle>
              <CardDescription>Manage all registered schools</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email…"
                  className="pl-9 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />Add School
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSchools.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{searchQuery ? "No matching schools" : "No schools yet"}</h3>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}><Plus className="mr-2 h-4 w-4" />Add School</Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                      <TableHead className="text-right">Monthly Fee</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead className="w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => {
                      const effectiveState = calculateEffectiveState(school);
                      const daysRemaining = getDaysRemaining(school);
                      const needsActivation = effectiveState === 'trial_expired';
                      const plan = school.subscription_plan || 'starter';
                      const count = studentCounts[school.id] || 0;
                      const { perStudentFee, baseFee } = getPricingForPlan(plan);
                      const billing = calculateMonthlyFee(count, perStudentFee, baseFee, school.discount_percent || 0, school.custom_per_student_fee);
                      const billingCycle = (school as any).billing_cycle || 'monthly';
                      const nextBilling = (school as any).next_billing_date;

                      return (
                        <TableRow key={school.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{school.name}</p>
                              <p className="text-xs text-muted-foreground">{school.email || "-"}</p>
                              {(school as any).referred_by && partnerMap[(school as any).referred_by] && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="mt-1 text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20 cursor-default">
                                        <Handshake className="h-3 w-3 mr-1" />
                                        {partnerMap[(school as any).referred_by]}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>Referred by partner: {partnerMap[(school as any).referred_by]}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
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
                          <TableCell className="text-right tabular-nums">
                            <div className="flex items-center justify-end gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />{count}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            ₹{billing.effectiveRate}
                            {school.custom_per_student_fee != null && <span className="text-xs text-muted-foreground ml-1">*</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            <div>
                              ₹{billing.totalFee.toLocaleString("en-IN")}
                              {school.discount_percent > 0 && (
                                <Badge variant="outline" className="ml-1 text-xs text-emerald-600 border-emerald-500/20">
                                  -{school.discount_percent}%
                                </Badge>
                              )}
                              {billingCycle === 'annual' && (
                                <p className="text-xs text-muted-foreground">×12 annual</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {nextBilling ? format(new Date(nextBilling), "dd MMM yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            <SystemStateBadge state={effectiveState} size="sm" />
                          </TableCell>
                          <TableCell>
                            {daysRemaining !== null ? (
                              <span className={daysRemaining <= 0 ? 'text-destructive font-medium' : daysRemaining <= 7 ? 'text-amber-600 font-medium' : ''}>
                                {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d`}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditingSchool(school)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openInvoice(school)} title="Invoice">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setPaymentSchool(school)} title="Record Payment">
                                <CreditCard className="h-4 w-4" />
                              </Button>
                              {needsActivation && (
                                <Button variant="default" size="sm" onClick={() => setActivatingSchool(school)}>
                                  <Zap className="h-4 w-4 mr-1" />Activate
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

      <CreateSchoolDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={fetchSchools} />
      <EditSchoolDialog school={editingSchool} open={!!editingSchool} onOpenChange={(open) => !open && setEditingSchool(null)} onSuccess={fetchSchools} />
      <ActivateSchoolDialog school={activatingSchool} open={!!activatingSchool} onOpenChange={(open) => !open && setActivatingSchool(null)} onSuccess={fetchSchools} />
      <InvoiceModal school={invoiceSchool} invoiceData={invoiceData} open={!!invoiceSchool} onOpenChange={(open) => { if (!open) { setInvoiceSchool(null); setInvoiceData(null); } }} onPaid={() => { fetchSchools(); fetchCollectionThisMonth(); }} />
      <RecordPaymentDialog school={paymentSchool} open={!!paymentSchool} onOpenChange={(open) => { if (!open) setPaymentSchool(null); }} onSuccess={() => { fetchSchools(); fetchCollectionThisMonth(); }} />
    </div>
  );
}
