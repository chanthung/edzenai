import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type School = Tables<"schools">;

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

interface InvoiceModalProps {
  school: School | null;
  invoiceData: InvoiceData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = format(now, "yyyyMMdd");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${rand}`;
}

export function InvoiceModal({ school, invoiceData, open, onOpenChange, onPaid }: InvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [invoiceNumber] = useState(generateInvoiceNumber);

  if (!school || !invoiceData) return null;

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      // Save invoice
      const { error: invoiceError } = await supabase
        .from("platform_invoices" as any)
        .insert({
          school_id: school.id,
          invoice_number: invoiceNumber,
          subtotal: invoiceData.subtotal,
          volume_discount: invoiceData.volumeDiscountAmount,
          annual_discount: invoiceData.annualDiscountAmount,
          taxable_amount: invoiceData.taxableAmount,
          cgst: invoiceData.cgst,
          sgst: invoiceData.sgst,
          total_amount: invoiceData.totalAmount,
          status: "paid",
          paid_at: new Date().toISOString(),
        } as any);
      if (invoiceError) throw invoiceError;

      // Record platform payment
      const { error: payError } = await supabase
        .from("platform_payments" as any)
        .insert({
          school_id: school.id,
          amount: invoiceData.totalAmount,
          payment_date: format(new Date(), "yyyy-MM-dd"),
          reference_number: invoiceNumber,
          notes: `Invoice ${invoiceNumber} marked as paid`,
        } as any);
      if (payError) throw payError;

      // Decrement pending_amount
      const currentPending = (school as any).pending_amount || 0;
      const newPending = Math.max(0, currentPending - invoiceData.totalAmount);
      await supabase
        .from("schools")
        .update({ pending_amount: newPending } as any)
        .eq("id", school.id);

      toast.success("Invoice marked as paid");
      onPaid();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to record payment", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice</span>
            <Badge variant="outline">{invoiceNumber}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Bill To</p>
              <p className="font-medium">{school.name}</p>
              <p className="text-muted-foreground">{school.address || "Address not provided"}</p>
              <p className="text-muted-foreground">GSTIN: 00XXXXX0000X0X0</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-medium">EdZen AI</p>
              <p className="text-muted-foreground">Bengaluru, India</p>
              <p className="text-muted-foreground">GSTIN: 29XXXXX0000X0Z0</p>
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {invoiceData.plan.charAt(0).toUpperCase() + invoiceData.plan.slice(1)} Plan — {invoiceData.studentCount} students × {fmt(invoiceData.effectiveRate)}/student
              </span>
              <span className="tabular-nums">{fmt(invoiceData.subtotal)}</span>
            </div>

            {invoiceData.volumeDiscountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Volume Discount ({invoiceData.volumeDiscountPercent}%)</span>
                <span className="tabular-nums">-{fmt(invoiceData.volumeDiscountAmount)}</span>
              </div>
            )}

            {invoiceData.annualDiscountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Annual Billing Discount (10%)</span>
                <span className="tabular-nums">-{fmt(invoiceData.annualDiscountAmount)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Tax */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Amount</span>
              <span className="tabular-nums">{fmt(invoiceData.taxableAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST (9%)</span>
              <span className="tabular-nums">{fmt(invoiceData.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST (9%)</span>
              <span className="tabular-nums">{fmt(invoiceData.sgst)}</span>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-base font-bold">
            <span>Total Amount</span>
            <span className="tabular-nums">{fmt(invoiceData.totalAmount)}</span>
          </div>

          {invoiceData.billingCycle === "annual" && (
            <p className="text-xs text-muted-foreground">
              * This is an annual invoice. Monthly equivalent: {fmt(invoiceData.totalAmount / 12)}/month
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => toast.info("PDF download coming soon")}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button className="flex-1" onClick={handleMarkAsPaid} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Mark as Paid
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
