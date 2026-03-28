import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type School = Tables<"schools">;

interface RecordPaymentDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordPaymentDialog({ school, open, onOpenChange, onSuccess }: RecordPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!school) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("platform_payments" as any)
        .insert({
          school_id: school.id,
          amount: parsedAmount,
          payment_date: paymentDate,
          reference_number: referenceNumber || null,
          notes: notes || null,
        } as any);
      if (error) throw error;

      // Decrement pending_amount
      const currentPending = (school as any).pending_amount || 0;
      const newPending = Math.max(0, currentPending - parsedAmount);
      await supabase
        .from("schools")
        .update({ pending_amount: newPending } as any)
        .eq("id", school.id);

      toast.success(`₹${parsedAmount.toLocaleString("en-IN")} payment recorded`);
      setAmount("");
      setReferenceNumber("");
      setNotes("");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to record payment", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {school?.name} — Pending: ₹{((school as any)?.pending_amount || 0).toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Amount (₹) *</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" />
          </div>
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reference Number</Label>
            <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
