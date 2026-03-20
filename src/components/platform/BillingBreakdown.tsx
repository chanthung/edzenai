import { IndianRupee } from "lucide-react";
import { calculateMonthlyFee } from "@/hooks/useSubscriptionPricing";

interface BillingBreakdownProps {
  studentCount: number;
  perStudentFee: number;
  baseFee: number;
  discountPercent?: number;
  customPerStudentFee?: number | null;
  compact?: boolean;
}

export function BillingBreakdown({
  studentCount,
  perStudentFee,
  baseFee,
  discountPercent = 0,
  customPerStudentFee,
  compact = false,
}: BillingBreakdownProps) {
  const billing = calculateMonthlyFee(
    studentCount,
    perStudentFee,
    baseFee,
    discountPercent,
    customPerStudentFee,
  );

  if (compact) {
    return (
      <span className="font-medium tabular-nums">
        ₹{billing.totalFee.toLocaleString("en-IN")}
      </span>
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
      <div className="flex items-center gap-1.5 font-medium text-foreground mb-3">
        <IndianRupee className="h-4 w-4" />
        Fee Breakdown
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {billing.studentCount} students × ₹{billing.effectiveRate}/student
          </span>
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
          <span>Monthly Total</span>
          <span className="tabular-nums">₹{billing.totalFee.toLocaleString("en-IN")}</span>
        </div>
      </div>
      {customPerStudentFee != null && (
        <p className="text-xs text-muted-foreground mt-1">
          Custom rate applied (default: ₹{perStudentFee}/student)
        </p>
      )}
    </div>
  );
}
