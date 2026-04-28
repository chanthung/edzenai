import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Commission {
  id: string;
  amount: number;
  payment_amount: number;
  commission_percent: number;
  created_at: string;
  status: string;
}

interface Props {
  partnerId: string;
  partnerName: string;
  pendingCommissions: Commission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordPayoutDialog({ partnerId, partnerName, pendingCommissions, open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(format(new Date(), "yyyy-MM-dd"));

  const total = useMemo(
    () => pendingCommissions.filter(c => selected.has(c.id)).reduce((s, c) => s + Number(c.amount), 0),
    [selected, pendingCommissions]
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === pendingCommissions.length) setSelected(new Set());
    else setSelected(new Set(pendingCommissions.map(c => c.id)));
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one commission");
      return;
    }
    setLoading(true);
    try {
      const { data: payout, error: payoutErr } = await supabase
        .from("partner_payouts" as any)
        .insert({
          partner_id: partnerId,
          total_amount: total,
          paid_at: paidAt,
          reference_number: reference || null,
          notes: notes || null,
          recorded_by: user?.id,
        } as any)
        .select()
        .single();
      if (payoutErr) throw payoutErr;

      const { error: updErr } = await supabase
        .from("partner_commissions" as any)
        .update({ status: "paid", payout_id: (payout as any).id } as any)
        .in("id", Array.from(selected));
      if (updErr) throw updErr;

      toast.success(`₹${total.toLocaleString("en-IN")} payout recorded`);
      setSelected(new Set()); setReference(""); setNotes("");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to record payout", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Record Payout — {partnerName}</DialogTitle>
          <DialogDescription>Select pending commissions to mark as paid.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {pendingCommissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending commissions.</p>
          ) : (
            <>
              <div className="border rounded-xl max-h-64 overflow-y-auto">
                <div className="flex items-center gap-3 p-3 border-b bg-muted/30 text-xs font-medium">
                  <Checkbox checked={selected.size === pendingCommissions.length && pendingCommissions.length > 0} onCheckedChange={toggleAll} />
                  <span className="flex-1">Date</span>
                  <span className="w-24 text-right">Payment</span>
                  <span className="w-24 text-right">Commission</span>
                </div>
                {pendingCommissions.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 border-b last:border-0 text-sm">
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                    <span className="flex-1">{format(new Date(c.created_at), "dd MMM yyyy")}</span>
                    <span className="w-24 text-right tabular-nums">₹{Number(c.payment_amount).toLocaleString("en-IN")}</span>
                    <span className="w-24 text-right tabular-nums font-medium">₹{Number(c.amount).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm bg-primary/5 rounded-xl px-4 py-3">
                <span className="font-medium">Selected: {selected.size}</span>
                <span className="font-bold text-lg">₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Paid On</Label>
                  <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Reference #</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / cheque" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || selected.size === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Mark as Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
