import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, useNavigate } from "react-router-dom";
import { Check, Star, Users, ShieldCheck, Clock, BadgePercent, CalendarDays, Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSubscriptionPricing, DEFAULT_STARTER_RATE, DEFAULT_PRO_RATE } from "@/hooks/useSubscriptionPricing";
import { useVolumeDiscounts, getApplicableDiscount } from "@/hooks/useVolumeDiscounts";
import { useSchool } from "@/hooks/useSchool";
import { useStudents } from "@/hooks/useStudents";
import { useSchoolStudentCount } from "@/hooks/useSchoolStudentCount";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PaymentMethodDialog } from "@/components/PaymentMethodDialog";
import { toast } from "sonner";

const starterFeatures = [
  "Student management & bulk upload",
  "Fee categories, structures & payments",
  "Attendance tracking & leave records",
  "Parent Link & Telegram notifications",
  "Academic years & promotions",
  "Teacher accounts",
  "Basic reports (view only)",
];

const proFeatures = [
  "Everything in Starter",
  "AI-powered student insights",
  "Automated NEP 2020 report cards",
  "AI Excel import with smart mapping",
  "Performance analytics & charts",
  "Competency & at-risk detection",
  "PTM summary generation",
  "CSV / PDF exports",
  "AI Help Assistant (Chatbot)",
];

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function getPriceId(plan: 'starter' | 'pro', billing: 'monthly' | 'annual') {
  return `${plan}_${billing}`;
}

export default function Pricing() {
  usePageMeta({ title: "Pricing – EdZen AI", description: "Simple per-student pricing for EdZen AI school management. Starter from ₹7/student/month. 30-day Pro free trial, no credit card required.", canonical: "/pricing" });
  const [students, setStudents] = useState(100);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoadingMethod, setPaymentLoadingMethod] = useState<'upi' | 'card' | null>(null);
  const { data: pricing } = useSubscriptionPricing();
  const { data: tiers = [] } = useVolumeDiscounts();
  const { user } = useAuth();
  const { effectiveState } = useSubscriptionStatus();
  const { data: school } = useSchool();
  const { data: studentsList } = useStudents();
  const { count: rosterCount, isLoading: rosterLoading } = useSchoolStudentCount();
  const { openCheckout: openPaddleCheckout, loading: paddleLoading } = usePaddleCheckout();
  const { openCheckout: openRazorpayCheckout, loading: razorpayLoading } = useRazorpayCheckout();
  const navigate = useNavigate();

  const checkoutLoading = paddleLoading || razorpayLoading;

  const isOnTrialOrSubscribed = !!user && (
    effectiveState === 'trial_active' ||
    effectiveState === 'subscription_active'
  );

  // Logged-in school context: use real roster as the source of truth.
  const isLoggedInSchool = !!user && !!school;
  // Slider/input lower bound. For schools, you can never bill for fewer
  // students than you actually have on file.
  const minStudents = isLoggedInSchool ? Math.max(1, rosterCount) : 1;

  // When the real roster loads (or changes), snap the slider up to it so the
  // displayed monthly fee always matches Settings → Subscription.
  useEffect(() => {
    if (isLoggedInSchool && !rosterLoading && rosterCount > 0) {
      setStudents((prev) => (prev < rosterCount ? rosterCount : prev));
    }
  }, [isLoggedInSchool, rosterLoading, rosterCount]);

  const STARTER_RATE = pricing?.find(p => p.plan === 'starter')?.per_student_fee ?? DEFAULT_STARTER_RATE;
  const PRO_RATE = pricing?.find(p => p.plan === 'pro')?.per_student_fee ?? DEFAULT_PRO_RATE;
  const discountPct = getApplicableDiscount(students, tiers);

  const handleSlider = (v: number[]) => {
    setStudents(Math.max(minStudents, v[0]));
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 1 && v <= 7000) setStudents(Math.max(minStudents, v));
    if (e.target.value === "") setStudents(minStudents);
  };

  const applyDiscount = (total: number) => Math.max(0, total - total * (discountPct / 100));
  const annualMultiplier = billingCycle === 'annual' ? 0.9 : 1;
  const starterTotal = applyDiscount(students * STARTER_RATE) * annualMultiplier;
  const proTotal = applyDiscount(students * PRO_RATE) * annualMultiplier;
  const diff = PRO_RATE - STARTER_RATE;

  const signupUrl = (plan: 'starter' | 'pro') => `/signup?plan=${plan}&billing=${billingCycle}`;

  // Gateway minimum billable quantity (volume-pricing floor in Paddle/Razorpay).
  const GATEWAY_MIN_QTY = 10;
  // What we will actually bill for: the displayed slider value, but never
  // below the real roster (already enforced by minStudents) and never below
  // the gateway minimum.
  const billableStudents = Math.max(students, GATEWAY_MIN_QTY);
  const isBelowGatewayMin = isLoggedInSchool && rosterCount > 0 && rosterCount < GATEWAY_MIN_QTY;
  const hasNoStudents = isLoggedInSchool && rosterCount === 0;

  // For logged-in users: show payment method dialog
  const handleCheckout = (plan: 'starter' | 'pro') => {
    if (!user || !school) {
      toast.error("Please log in and set up your school first");
      return;
    }
    if (hasNoStudents) {
      toast.error("Add students before subscribing", {
        description: "Your subscription is billed per student. Add students first.",
      });
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePayViaUPI = async () => {
    if (!user || !school) return;
    setPaymentLoadingMethod('upi');
    try {
      await openRazorpayCheckout({
        schoolId: school.id,
        userId: user.id,
        plan: selectedPlan,
        billingCycle,
        studentCount: billableStudents,
        customerEmail: user.email || undefined,
        onSuccess: () => {
          setPaymentDialogOpen(false);
          navigate('/admin?checkout=success');
        },
      });
    } catch {
      // error handled in hook
    } finally {
      setPaymentLoadingMethod(null);
    }
  };

  const handlePayViaCard = async () => {
    if (!user || !school) return;
    setPaymentLoadingMethod('card');
    try {
      const priceId = getPriceId(selectedPlan, billingCycle);
      await openPaddleCheckout({
        priceId,
        quantity: billableStudents,
        customerEmail: user.email || undefined,
        customData: {
          userId: user.id,
          schoolId: school.id,
        },
        successUrl: `${window.location.origin}/admin?checkout=success`,
      });
      setPaymentDialogOpen(false);
    } catch {
      // error handled in hook
    } finally {
      setPaymentLoadingMethod(null);
    }
  };

  // Determine if the logged-in user can directly checkout (has school, not already subscribed)
  const canDirectCheckout = !!user && !!school && effectiveState !== 'subscription_active' && !hasNoStudents;

  return (
    <div className="min-h-[100dvh] bg-background">
      <PaymentTestModeBanner />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            EdZen AI
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button size="sm" variant="outline" asChild>
                <Link to="/admin">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup?plan=pro">Start Free Trial</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Headline */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-xl mx-auto">
            Pay only for the students you manage. No hidden fees.
          </p>
        </div>

        {/* Student count calculator */}
        <h2 className="sr-only">Pricing calculator</h2>
        <div className="max-w-md mx-auto mb-12 bg-card border rounded-xl p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <Users className="h-4 w-4 text-primary" />
            Number of students
          </label>
          <div className="flex items-center gap-4 mb-3">
            <Slider
              value={[students]}
              onValueChange={handleSlider}
              min={Math.max(10, minStudents)}
              max={7000}
              step={10}
              className="flex-1"
            />
            <Input
              type="number"
              value={students}
              onChange={handleInput}
              min={minStudents}
              max={7000}
              className="w-24 text-center tabular-nums font-semibold"
            />
          </div>
          {isLoggedInSchool ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground text-center">
                Auto-filled from your{" "}
                <Link to="/admin/students" className="text-primary hover:underline font-medium">
                  Students module
                </Link>
                : <span className="font-semibold text-foreground tabular-nums">{rosterCount}</span> on roster.
                You can bill for more, but not fewer.
              </p>
              {isBelowGatewayMin && (
                <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 rounded-md px-2.5 py-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Minimum billable quantity is {GATEWAY_MIN_QTY} students. You'll be charged for {GATEWAY_MIN_QTY}.
                  </span>
                </div>
              )}
              {hasNoStudents && (
                <div className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Add students before subscribing.{" "}
                    <Link to="/admin/students" className="underline font-medium">Go to Students →</Link>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Drag or type to see your monthly cost
            </p>
          )}
          {discountPct > 0 && (
            <p className="text-center mt-2">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200">
                <BadgePercent className="h-3 w-3 mr-1" />
                {discountPct}% volume discount applied!
              </Badge>
            </p>
          )}
          {tiers.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {tiers.map((t) => (
                <Badge key={t.id} variant="outline" className={cn("text-xs", students >= t.min_students && (t.max_students === null || students <= t.max_students) ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20" : "")}>
                  {t.max_students != null ? `${t.min_students}–${t.max_students}` : `${t.min_students}+`} students → {t.discount_percent}% off
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all",
              billingCycle === 'monthly'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
              billingCycle === 'annual'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Annual
            <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20">
              Save 10%
            </Badge>
          </button>
        </div>

        {/* Pricing cards */}
        <h2 className="sr-only">Plans</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Starter */}
          <Card
            className={cn(
              "relative flex flex-col cursor-pointer transition-all",
              selectedPlan === 'starter'
                ? "border-primary shadow-lg ring-2 ring-primary/20"
                : "hover:border-primary/40"
            )}
            onClick={() => setSelectedPlan('starter')}
          >
            {selectedPlan === 'starter' && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs gap-1">
                  <Check className="h-3 w-3" /> Selected
                </Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Starter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic features for small schools
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatINR(STARTER_RATE)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ student / month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                  For {students} students:{" "}
                  <span className="font-semibold text-foreground">
                    {formatINR(starterTotal)}/{billingCycle === 'annual' ? 'month (billed annually)' : 'month'}
                  </span>
                </p>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    You save {formatINR(applyDiscount(students * STARTER_RATE) * 12 * 0.1)}/year
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <PlanButton
                plan="starter"
                isSelected={selectedPlan === 'starter'}
                canDirectCheckout={canDirectCheckout}
                isOnTrialOrSubscribed={isOnTrialOrSubscribed}
                checkoutLoading={checkoutLoading}
                onCheckout={() => handleCheckout('starter')}
                onSelect={() => setSelectedPlan('starter')}
                signupUrl={signupUrl('starter')}
              />
            </CardContent>
          </Card>

          {/* Pro */}
          <Card
            className={cn(
              "relative flex flex-col cursor-pointer transition-all border-2",
              selectedPlan === 'pro'
                ? "border-primary shadow-lg ring-2 ring-primary/20"
                : "border-primary/30 hover:border-primary/60"
            )}
            onClick={() => setSelectedPlan('pro')}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className={cn(
                "px-3 py-1 text-xs gap-1",
                selectedPlan === 'pro'
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/90 text-primary-foreground"
              )}>
                {selectedPlan === 'pro' ? <><Check className="h-3 w-3" /> Selected</> : <><Star className="h-3 w-3" /> Most Popular</>}
              </Badge>
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Pro</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full AI-powered intelligence suite
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatINR(PRO_RATE)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ student / month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                  For {students} students:{" "}
                  <span className="font-semibold text-foreground">
                    {formatINR(proTotal)}/{billingCycle === 'annual' ? 'month (billed annually)' : 'month'}
                  </span>
                </p>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    You save {formatINR(applyDiscount(students * PRO_RATE) * 12 * 0.1)}/year
                  </p>
                )}
                <p className="text-xs text-primary font-medium mt-1">30-day free trial included</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <PlanButton
                plan="pro"
                isSelected={selectedPlan === 'pro'}
                canDirectCheckout={canDirectCheckout}
                isOnTrialOrSubscribed={isOnTrialOrSubscribed && effectiveState !== 'trial_active'}
                checkoutLoading={checkoutLoading}
                onCheckout={() => handleCheckout('pro')}
                onSelect={() => setSelectedPlan('pro')}
                signupUrl={signupUrl('pro')}
                isPro
              />
            </CardContent>
          </Card>
        </div>

        {/* CTA + Value message */}
        <div className="text-center mb-12 space-y-4">
          {effectiveState === 'subscription_active' ? (
            <Button size="lg" className="px-10 text-base" asChild>
              <Link to="/admin">Go to Dashboard</Link>
            </Button>
          ) : canDirectCheckout ? (
            <Button
              size="lg"
              className="px-10 text-base"
              onClick={() => handleCheckout(selectedPlan)}
              disabled={checkoutLoading}
            >
              {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedPlan === 'pro' ? 'Subscribe to Pro →' : 'Subscribe to Starter →'}
            </Button>
          ) : (
            <Button size="lg" className="px-10 text-base" asChild>
              <Link to={signupUrl(selectedPlan)}>
                {selectedPlan === 'pro' ? 'Try Pro Free for 30 Days →' : 'Continue with Starter →'}
              </Link>
            </Button>
          )}
          {!isOnTrialOrSubscribed && selectedPlan === 'starter' && (
            <p className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground border border-accent/20 rounded-full px-5 py-2 text-sm font-medium">
              <Star className="h-4 w-4 text-accent" />
              Only {formatINR(diff)} more per student for AI-powered automation + free 30-day trial
            </p>
          )}
        </div>

        {/* Trust elements */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-muted-foreground mb-16">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" /> Cancel anytime
          </span>
          <span className="flex items-center gap-1.5">
            <BadgePercent className="h-4 w-4 text-primary" /> Volume discounts available
          </span>
        </div>

        {/* FAQ-style trust */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Built for modern Indian schools
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            NEP 2020 aligned • Works for CBSE, ICSE & State Boards • 30-day free trial on Pro plan
          </p>
        </div>
      </main>

      <PaymentMethodDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSelectUPI={handlePayViaUPI}
        onSelectCard={handlePayViaCard}
        loading={paymentLoadingMethod !== null}
        loadingMethod={paymentLoadingMethod}
        planLabel={`${selectedPlan === 'pro' ? 'Pro' : 'Starter'} (${billingCycle})`}
      />
    </div>
  );
}

// Extracted button component for plan cards
function PlanButton({
  plan,
  isSelected,
  canDirectCheckout,
  isOnTrialOrSubscribed,
  checkoutLoading,
  onCheckout,
  onSelect,
  signupUrl,
  isPro = false,
}: {
  plan: 'starter' | 'pro';
  isSelected: boolean;
  canDirectCheckout: boolean;
  isOnTrialOrSubscribed: boolean;
  checkoutLoading: boolean;
  onCheckout: () => void;
  onSelect: () => void;
  signupUrl: string;
  isPro?: boolean;
}) {
  const label = isPro ? 'Subscribe to Pro' : 'Subscribe to Starter';
  const trialLabel = isPro ? 'Try Pro Free for 30 Days' : 'Get Started';

  if (isSelected && canDirectCheckout) {
    return (
      <Button
        className="w-full"
        onClick={(e) => { e.stopPropagation(); onCheckout(); }}
        disabled={checkoutLoading}
      >
        {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label} →
      </Button>
    );
  }

  if (isSelected && !isOnTrialOrSubscribed) {
    return (
      <Button className="w-full" asChild>
        <Link to={signupUrl} onClick={(e) => e.stopPropagation()}>
          {isPro ? 'Try Pro Free for 30 Days →' : 'Continue with Starter →'}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      className="w-full"
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {isSelected ? '✓ Selected' : trialLabel}
    </Button>
  );
}
