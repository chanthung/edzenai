import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function generateCode(name: string) {
  const base = (name || "PARTNER").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PART";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}${suffix}`;
}

export function CreatePartnerDialog({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("20");

  const reset = () => {
    setName(""); setEmail(""); setPhone(""); setReferralCode(""); setCommissionPercent("20");
  };

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
    const code = (referralCode.trim() || generateCode(name)).toUpperCase();

    setLoading(true);
    try {
      const { error } = await supabase.from("partners" as any).insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        referral_code: code,
        commission_percent: pct,
        is_active: true,
      } as any);
      if (error) throw error;
      toast.success(`Partner created — code: ${code}`);
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to create partner", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Add Partner</DialogTitle>
          <DialogDescription>Create a new affiliate partner. They'll get a unique referral link.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Partner full name" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="Auto-generated" />
            </div>
            <div className="space-y-2">
              <Label>Commission % *</Label>
              <Input type="number" min="0" max="100" step="0.5" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Partner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
