import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SystemStateBadge } from "@/components/ui/system-state-badge";
import { PLAN_DISPLAY, type SubscriptionPlan } from "@/config/plan-features";
import { useSubscriptionPricing } from "@/hooks/useSubscriptionPricing";
import { BillingBreakdown } from "@/components/platform/BillingBreakdown";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type School = Tables<"schools">;

interface EditSchoolDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSchoolDialog({ school, open, onOpenChange, onSuccess }: EditSchoolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [emailingReset, setEmailingReset] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [adminLoginEmail, setAdminLoginEmail] = useState<string | null>(null);
  const [loadingAdminEmail, setLoadingAdminEmail] = useState(false);
  const { data: pricing } = useSubscriptionPricing();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    upi_id: "",
    qr_code_url: "",
    subscription_type: "monthly",
    subscription_status: "active",
    subscription_start_date: "",
    subscription_renewal_date: "",
    trial_start_date: "",
    trial_end_date: "",
    subscription_plan: "starter" as SubscriptionPlan,
    custom_per_student_fee: "",
    discount_percent: "0",
    billing_cycle: "monthly",
    next_billing_date: "",
  });

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || "",
        address: school.address || "",
        phone: school.phone || "",
        email: school.email || "",
        upi_id: school.upi_id || "",
        qr_code_url: school.qr_code_url || "",
        subscription_type: school.subscription_type || "monthly",
        subscription_status: school.subscription_status || "active",
        subscription_start_date: school.subscription_start_date || "",
        subscription_renewal_date: school.subscription_renewal_date || "",
        trial_start_date: school.trial_start_date || "",
        trial_end_date: school.trial_end_date || "",
        subscription_plan: ((school as any).subscription_plan as SubscriptionPlan) || "starter",
        custom_per_student_fee: (school as any).custom_per_student_fee != null ? String((school as any).custom_per_student_fee) : "",
        discount_percent: String((school as any).discount_percent || 0),
        billing_cycle: (school as any).billing_cycle || "monthly",
        next_billing_date: (school as any).next_billing_date || "",
      });
      fetchStudentCount(school.id);
      fetchAdminEmail(school.id);
    }
  }, [school]);

  const fetchStudentCount = async (schoolId: string) => {
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId);
    setStudentCount(count || 0);
  };

  const fetchAdminEmail = async (schoolId: string) => {
    setLoadingAdminEmail(true);
    setAdminLoginEmail(null);
    try {
      const { data, error } = await supabase.functions.invoke('reset-school-admin', {
        body: { schoolId, action: 'get-admin-email' },
      });
      if (!error && data?.adminEmail) {
        setAdminLoginEmail(data.adminEmail);
      }
    } catch {
      // Non-critical - just won't show the admin email
    } finally {
      setLoadingAdminEmail(false);
    }
  };

  const getPlanPricing = (plan: string) => {
    const p = pricing?.find((pr) => pr.plan === plan);
    return { perStudentFee: p?.per_student_fee ?? (plan === 'pro' ? 8 : 5), baseFee: p?.base_monthly_fee ?? 0 };
  };

  const computeSystemState = () => {
    if (school?.payment_verified && formData.subscription_status === 'active') {
      return 'subscription_active' as const;
    }
    if (!formData.trial_end_date) {
      return 'trial_active' as const;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trialEnd = new Date(formData.trial_end_date);
    trialEnd.setHours(0, 0, 0, 0);
    if (today <= trialEnd) {
      return 'trial_active' as const;
    }
    return 'trial_expired' as const;
  };

  const handleSubmit = async () => {
    if (!school) return;
    
    if (!formData.name.trim()) {
      toast.error("School name is required");
      return;
    }

    setLoading(true);
    try {
      const computedState = computeSystemState();
      const customFee = formData.custom_per_student_fee.trim() ? parseFloat(formData.custom_per_student_fee) : null;
      const discount = parseFloat(formData.discount_percent) || 0;

      const { error } = await supabase
        .from('schools')
        .update({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          upi_id: formData.upi_id || null,
          qr_code_url: formData.qr_code_url || null,
          subscription_type: formData.subscription_type,
          subscription_status: formData.subscription_status,
          subscription_start_date: formData.subscription_start_date || null,
          subscription_renewal_date: formData.subscription_renewal_date || null,
          trial_start_date: formData.trial_start_date || null,
          trial_end_date: formData.trial_end_date || null,
          system_state: computedState,
          subscription_plan: formData.subscription_plan,
          custom_per_student_fee: customFee,
          discount_percent: discount,
          billing_cycle: formData.billing_cycle,
          next_billing_date: formData.next_billing_date || null,
        } as any)
        .eq('id', school.id);

      if (error) throw error;

      toast.success("School updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update school", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    if (!school) return;
    setEmailingReset(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-school-admin', {
        body: {
          schoolId: school.id,
          action: 'send-reset',
          redirectTo: 'https://edzenai.com/reset-password',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Password reset link sent!", {
        description: `Sent to ${data.adminEmail}`,
      });
    } catch (err: any) {
      toast.error("Failed to send reset link", { description: err.message });
    } finally {
      setEmailingReset(false);
    }
  };

  const planPricing = getPlanPricing(formData.subscription_plan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Edit School</DialogTitle>
              <DialogDescription>
                Update school details and subscription information.
              </DialogDescription>
            </div>
            {school?.system_state && (
              <SystemStateBadge state={school.system_state} size="sm" />
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="grid gap-4 py-4 pr-2">
            {/* School Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">School Details</h4>
              <div className="space-y-2">
                <Label htmlFor="edit-school-name">School Name *</Label>
                <Input
                  id="edit-school-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-school-address">Address</Label>
                <Input
                  id="edit-school-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-school-phone">Phone</Label>
                  <Input
                    id="edit-school-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-school-email">School Contact Email</Label>
                  <Input
                    id="edit-school-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Payment Details</h4>
              <div className="space-y-2">
                <Label htmlFor="edit-school-upi">UPI ID</Label>
                <Input
                  id="edit-school-upi"
                  placeholder="school@upi"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-school-qr">QR Code URL</Label>
                <Input
                  id="edit-school-qr"
                  placeholder="https://..."
                  value={formData.qr_code_url}
                  onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                />
              </div>
            </div>

            {/* Billing Cycle & Next Billing */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Billing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select
                    value={formData.billing_cycle}
                    onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-next-billing">Next Billing Date</Label>
                  <Input
                    id="edit-next-billing"
                    type="date"
                    value={formData.next_billing_date}
                    onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Trial Period */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Trial Period</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-trial-start">Trial Start Date</Label>
                  <Input
                    id="edit-trial-start"
                    type="date"
                    value={formData.trial_start_date}
                    onChange={(e) => setFormData({ ...formData, trial_start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-trial-end">Trial End Date</Label>
                  <Input
                    id="edit-trial-end"
                    type="date"
                    value={formData.trial_end_date}
                    onChange={(e) => setFormData({ ...formData, trial_end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Subscription Plan */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Subscription Plan</h4>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(PLAN_DISPLAY) as SubscriptionPlan[]).map((plan) => {
                  const info = PLAN_DISPLAY[plan];
                  const isSelected = formData.subscription_plan === plan;
                  return (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setFormData({ ...formData, subscription_plan: plan })}
                      className={cn(
                        "rounded-lg border-2 p-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <Badge className={cn("mb-1", info.colorClass)}>{info.badge}</Badge>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing Override */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Pricing Override</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custom Per-Student Fee (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder={`Default: ₹${planPricing.perStudentFee}`}
                    value={formData.custom_per_student_fee}
                    onChange={(e) => setFormData({ ...formData, custom_per_student_fee: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use plan default</p>
                </div>
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  />
                </div>
              </div>

              {/* Billing Preview */}
              <BillingBreakdown
                studentCount={studentCount}
                perStudentFee={planPricing.perStudentFee}
                baseFee={planPricing.baseFee}
                discountPercent={parseFloat(formData.discount_percent) || 0}
                customPerStudentFee={formData.custom_per_student_fee.trim() ? parseFloat(formData.custom_per_student_fee) : null}
              />
            </div>

            {/* Subscription Details */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Subscription Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subscription Type</Label>
                  <Select
                    value={formData.subscription_type}
                    onValueChange={(value) => setFormData({ ...formData, subscription_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subscription Status</Label>
                  <Select
                    value={formData.subscription_status}
                    onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sub-start">Start Date</Label>
                  <Input
                    id="edit-sub-start"
                    type="date"
                    value={formData.subscription_start_date}
                    onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sub-renewal">Renewal Date</Label>
                  <Input
                    id="edit-sub-renewal"
                    type="date"
                    value={formData.subscription_renewal_date}
                    onChange={(e) => setFormData({ ...formData, subscription_renewal_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Admin Password Reset */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Admin Password Reset</h4>
              
              {/* Admin Login Email (read-only) */}
              <div className="space-y-2">
                <Label>Admin Login Email</Label>
                {loadingAdminEmail ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Resolving admin email...
                  </div>
                ) : adminLoginEmail ? (
                  <Input value={adminLoginEmail} readOnly className="bg-muted/50" />
                ) : (
                  <p className="text-sm text-muted-foreground">Could not resolve admin login email</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is the email the school admin uses to log in (may differ from the school contact email above).
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Send Password Reset Link</p>
                  <p className="text-xs text-muted-foreground">
                    Sends a reset email to the admin login email above so they can set a new password.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={emailingReset || !school?.id || !adminLoginEmail}
                  onClick={handleSendReset}
                >
                  {emailingReset ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Email Reset Link
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}