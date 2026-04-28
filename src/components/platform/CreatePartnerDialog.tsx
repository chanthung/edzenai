import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-partner-invite", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          referral_code: referralCode.trim() || null,
          commission_percent: pct,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Partner created — code: ${data.referralCode}`, {
        description: data.emailSent
          ? "Invite email sent. They'll set their password via the link."
          : "Partner created, but invite email failed. Resend from the partner detail page.",
      });
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
          <DialogDescription>
            Create a new affiliate partner. They'll receive an email invite to set their password and access the partner dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Partner full name" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@example.com" />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Invite email with password setup link will be sent here
            </p>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create & Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
