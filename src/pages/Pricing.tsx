import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Star, Users, ShieldCheck, Clock, BadgePercent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSubscriptionPricing } from "@/hooks/useSubscriptionPricing";
import { useVolumeDiscounts, getApplicableDiscount } from "@/hooks/useVolumeDiscounts";

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

export default function Pricing() {
  const [students, setStudents] = useState(100);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');
  const { data: pricing } = useSubscriptionPricing();
  const { data: tiers = [] } = useVolumeDiscounts();

  const STARTER_RATE = pricing?.find(p => p.plan === 'starter')?.per_student_fee ?? 8;
  const PRO_RATE = pricing?.find(p => p.plan === 'pro')?.per_student_fee ?? 10;
  const discountPct = getApplicableDiscount(students, tiers);

  const handleSlider = (v: number[]) => setStudents(v[0]);
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 1 && v <= 5000) setStudents(v);
    if (e.target.value === "") setStudents(1);
  };

  const applyDiscount = (total: number) => Math.max(0, total - total * (discountPct / 100));
  const starterTotal = applyDiscount(students * STARTER_RATE);
  const proTotal = applyDiscount(students * PRO_RATE);
  const diff = PRO_RATE - STARTER_RATE;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            EdZen AI
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
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
        <div className="max-w-md mx-auto mb-12 bg-card border rounded-xl p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <Users className="h-4 w-4 text-primary" />
            Number of students
          </label>
          <div className="flex items-center gap-4 mb-3">
            <Slider
              value={[students]}
              onValueChange={handleSlider}
              min={10}
              max={2000}
              step={10}
              className="flex-1"
            />
            <Input
              type="number"
              value={students}
              onChange={handleInput}
              min={1}
              max={5000}
              className="w-24 text-center tabular-nums font-semibold"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Drag or type to see your monthly cost
          </p>
          {discountPct > 0 && (
            <p className="text-center mt-2">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200">
                <BadgePercent className="h-3 w-3 mr-1" />
                {discountPct}% volume discount applied!
              </Badge>
            </p>
          )}
          {discountPct === 0 && tiers.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {tiers.map((t) => (
                <span key={t.id} className="text-xs text-muted-foreground">
                  {t.min_students}+ students → {t.discount_percent}% off
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Starter */}
          <Card className="relative flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Starter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Core school operations
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
                    {formatINR(starterTotal)}/month
                  </span>
                </p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="relative flex flex-col border-primary shadow-lg ring-2 ring-primary/20">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs gap-1">
                <Star className="h-3 w-3" /> Most Popular
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
                    {formatINR(proTotal)}/month
                  </span>
                </p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button className="w-full" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Value message */}
        <div className="text-center mb-12">
          <p className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground border border-accent/20 rounded-full px-5 py-2 text-sm font-medium">
            <Star className="h-4 w-4 text-accent" />
            Only {formatINR(diff)} more per student for AI-powered automation
          </p>
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
            NEP 2020 aligned • Works for CBSE, ICSE & State Boards • 30-day free trial on all plans
          </p>
        </div>
      </main>
    </div>
  );
}
