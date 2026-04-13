import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionPricing } from "@/hooks/useSubscriptionPricing";
import { useVolumeDiscounts, getApplicableDiscount } from "@/hooks/useVolumeDiscounts";
import type { SubscriptionPlan } from "@/config/plan-features";

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function PricingCalculator() {
  const [plan, setPlan] = useState<SubscriptionPlan>("starter");
  const [students, setStudents] = useState(100);
  const { data: pricing } = useSubscriptionPricing();
  const { data: tiers = [] } = useVolumeDiscounts();

  const starterRate = pricing?.find((p) => p.plan === "starter")?.per_student_fee ?? DEFAULT_STARTER_RATE;
  const proRate = pricing?.find((p) => p.plan === "pro")?.per_student_fee ?? DEFAULT_PRO_RATE;
  const rate = plan === "starter" ? starterRate : proRate;
  const baseFee = pricing?.find((p) => p.plan === plan)?.base_monthly_fee ?? 0;
  const discountPct = getApplicableDiscount(students, tiers);

  const baseTotal = students * rate + baseFee;
  const discountAmt = baseTotal * (discountPct / 100);
  const finalTotal = Math.max(0, baseTotal - discountAmt);
  const effectivePerStudent = students > 0 ? finalTotal / students : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Live Pricing Calculator</CardTitle>
            <CardDescription>Preview how discounts affect monthly billing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan toggle */}
        <div className="space-y-2">
          <Label>Plan</Label>
          <div className="flex gap-2">
            {(["starter", "pro"] as SubscriptionPlan[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                  plan === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
                <span className="block text-xs font-normal mt-0.5">{formatINR(p === "starter" ? starterRate : proRate)}/student</span>
              </button>
            ))}
          </div>
        </div>

        {/* Student count */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label>Number of Students</Label>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[students]}
              onValueChange={([v]) => setStudents(v)}
              min={10}
              max={7000}
              step={10}
              className="flex-1"
            />
            <Input
              type="number"
              value={students}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1 && v <= 7000) setStudents(v);
                if (e.target.value === "") setStudents(1);
              }}
              min={1}
              max={7000}
              className="w-24 text-center tabular-nums font-semibold"
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{students} students × {formatINR(rate)}/student</span>
            <span className="tabular-nums">{formatINR(students * rate)}</span>
          </div>
          {baseFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base fee</span>
              <span className="tabular-nums">{formatINR(baseFee)}</span>
            </div>
          )}
          {discountPct > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1.5">
                Volume discount ({discountPct}%)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="h-3.5 w-3.5 cursor-help" /></TooltipTrigger>
                    <TooltipContent>
                      <p>Applied automatically for {students}+ students</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className="tabular-nums">-{formatINR(discountAmt)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold text-base">
            <span>Monthly Total</span>
            <span className="tabular-nums">{formatINR(finalTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Effective per-student price</span>
            <span className="tabular-nums font-medium text-foreground">{formatINR(effectivePerStudent)}</span>
          </div>
        </div>

        {/* Tier badges */}
        {tiers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tiers.map((t) => (
              <Badge key={t.id} variant="outline" className={cn("text-xs", students >= t.min_students && (t.max_students === null || students <= t.max_students) ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20" : "")}>
                {t.max_students != null ? `${t.min_students}–${t.max_students}` : `${t.min_students}+`} students → {t.discount_percent}% off
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
