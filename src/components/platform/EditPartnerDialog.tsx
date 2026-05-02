import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  partner: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPartnerDialog({ partner, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("20");

  useEffect(() => {
    if (partner && open) {
      setName(partner.name || "");
      setEmail(partner.email || "");
      setPhone(partner.phone || "");
      setReferralCode(partner.referral_code || "");
      setCommissionPercent(String(partner.commission_percent ?? 20));
    }
  }, [partner, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const pct = parseFloat(commissionPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Commission % must be between 0-100");
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("partners")
        .update({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          referral_code: referralCode.trim().toUpperCase(),
          commission_percent: pct,
        })
        .eq("id", partner.id);

      if (error) throw error;
      toast.success("Partner updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to update partner", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
          <DialogDescription>Update partner details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
              <Label>Commission %</Label>
              <Input type="number" min="0" max="100" step="0.5" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
