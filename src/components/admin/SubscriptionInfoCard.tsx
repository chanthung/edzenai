import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, Users, Calendar, Crown } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscriptionPricing, calculateMonthlyFee, getDefaultRate } from "@/hooks/useSubscriptionPricing";
import { PLAN_DISPLAY, type SubscriptionPlan } from "@/config/plan-features";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SubscriptionInfoCard() {
  const { data: school, isLoading: schoolLoading } = useSchool();
  const { effectiveState, daysRemaining } = useSubscriptionStatus();
  const { data: pricing, isLoading: pricingLoading } = useSubscriptionPricing();

  const { data: studentCount = 0 } = useQuery({
    queryKey: ['student-count', school?.id],
    queryFn: async () => {
      if (!school?.id) return 0;
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', school.id);
      return count || 0;
    },
    enabled: !!school?.id,
  });

  if (schoolLoading || pricingLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!school) return null;

  const plan = (school.subscription_plan as SubscriptionPlan) || 'starter';
  const planInfo = PLAN_DISPLAY[plan];
  const planPricing = pricing?.find((p) => p.plan === plan);
  const perStudentFee = planPricing?.per_student_fee ?? getDefaultRate(plan);
  const baseFee = planPricing?.base_monthly_fee ?? 0;
  const customFee = (school as any).custom_per_student_fee;
  const discount = (school as any).discount_percent || 0;

  const billing = calculateMonthlyFee(studentCount, perStudentFee, baseFee, discount, customFee);

  const stateLabels: Record<string, { label: string; className: string }> = {
    trial_active: { label: 'Trial Active', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    subscription_active: { label: 'Active', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    trial_expired: { label: 'Expired', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    restricted_mode: { label: 'Restricted', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  const stateInfo = stateLabels[effectiveState] || stateLabels.trial_active;

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Subscription</CardTitle>
              <Badge className={cn(planInfo.colorClass)}>{planInfo.badge}</Badge>
              <Badge variant="outline" className={cn(stateInfo.className)}>{stateInfo.label}</Badge>
            </div>
            <CardDescription>Your current plan and billing details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold tabular-nums">{studentCount}</p>
            <p className="text-xs text-muted-foreground">Active Students</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <IndianRupee className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold tabular-nums">₹{billing.effectiveRate}</p>
            <p className="text-xs text-muted-foreground">Per Student/Month</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <IndianRupee className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold tabular-nums">₹{billing.totalFee.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">Monthly Fee</p>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{billing.studentCount} students × ₹{billing.effectiveRate}</span>
            <span className="tabular-nums">₹{(billing.studentCount * billing.effectiveRate).toLocaleString("en-IN")}</span>
          </div>
          {billing.baseFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base fee</span>
              <span className="tabular-nums">₹{billing.baseFee.toLocaleString("en-IN")}</span>
            </div>
          )}
          {billing.discountPercent > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({billing.discountPercent}%)</span>
              <span className="tabular-nums">-₹{billing.discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="border-t pt-1.5 flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">₹{billing.totalFee.toLocaleString("en-IN")}/month</span>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          {school.subscription_renewal_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Renewal Date</p>
                <p className="font-medium">{format(new Date(school.subscription_renewal_date), "MMM d, yyyy")}</p>
              </div>
            </div>
          )}
          {daysRemaining !== null && effectiveState === 'trial_active' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Trial Remaining</p>
                <p className="font-medium">{daysRemaining} days</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
