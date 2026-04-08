import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, Calendar, CreditCard, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMonths, addYears } from "date-fns";
import { PLAN_DISPLAY, type SubscriptionPlan } from "@/config/plan-features";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type School = Tables<"schools">;

interface ActivateSchoolDialogProps {
  school: School | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function getSystemStateBadge(state: string | null) {
  switch (state) {
    case 'subscription_active':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Subscription Active</Badge>;
    case 'trial_active':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Trial Active</Badge>;
    case 'trial_expired':
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Trial Expired</Badge>;
    case 'restricted_mode':
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Restricted Mode</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export function ActivateSchoolDialog({ school, open, onOpenChange, onSuccess }: ActivateSchoolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("starter");
  const [checklist, setChecklist] = useState({
    paymentVerified: false,
    paymentReceived: false,
  });
  const [subscriptionType, setSubscriptionType] = useState<string>("monthly");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const calculateRenewalDate = () => {
    const startDate = new Date(subscriptionStartDate);
    if (subscriptionType === "monthly") {
      return format(addMonths(startDate, 1), "yyyy-MM-dd");
    } else {
      return format(addYears(startDate, 1), "yyyy-MM-dd");
    }
  };

  const canActivate = checklist.paymentVerified && checklist.paymentReceived && subscriptionStartDate;

  const handleActivate = async () => {
    if (!school || !canActivate) return;

    setLoading(true);
    try {
      const renewalDate = calculateRenewalDate();

      const { error } = await supabase
        .from('schools')
        .update({
          payment_verified: true,
          payment_verified_at: new Date().toISOString(),
          subscription_status: 'active',
          subscription_type: subscriptionType,
          subscription_start_date: subscriptionStartDate,
          subscription_renewal_date: renewalDate,
          system_state: 'subscription_active',
          subscription_plan: selectedPlan,
        } as any)
        .eq('id', school.id);

      if (error) throw error;

      // Send subscription confirmation email (fire-and-forget)
      if (school.email) {
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'subscription-confirmation',
            recipientEmail: school.email,
            idempotencyKey: `subscription-activate-${school.id}-${Date.now()}`,
            templateData: {
              schoolName: school.name,
              planName: PLAN_DISPLAY[selectedPlan].badge,
              subscriptionType: subscriptionType === 'monthly' ? 'Monthly' : 'Annual',
              startDate: format(new Date(subscriptionStartDate), 'dd MMM yyyy'),
              renewalDate: format(new Date(renewalDate), 'dd MMM yyyy'),
            },
          },
        }).catch(err => console.warn('Subscription email failed:', err));
      }

      toast.success("School activated successfully", {
        description: `${school.name} is now active on the ${PLAN_DISPLAY[selectedPlan].badge} plan with a ${subscriptionType} subscription.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to activate school", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!school) return null;

  const trialEndDate = school.trial_end_date ? new Date(school.trial_end_date) : null;
  const isTrialExpired = trialEndDate ? new Date() > trialEndDate : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Activate School Subscription
          </DialogTitle>
          <DialogDescription>
            Verify payment and activate the subscription for this school.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6 py-4 pr-2">
            {/* School Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{school.name}</span>
                {getSystemStateBadge(school.system_state)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Trial Started:</span>
                  <p className="font-medium">
                    {school.trial_start_date 
                      ? format(new Date(school.trial_start_date), "MMM d, yyyy")
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Trial Ends:</span>
                  <p className={`font-medium ${isTrialExpired ? 'text-destructive' : ''}`}>
                    {school.trial_end_date 
                      ? format(new Date(school.trial_end_date), "MMM d, yyyy")
                      : "Not set"}
                    {isTrialExpired && " (Expired)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Selector */}
            <div className="space-y-3">
              <h4 className="font-medium">Subscription Plan</h4>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(PLAN_DISPLAY) as SubscriptionPlan[]).map((plan) => {
                  const info = PLAN_DISPLAY[plan];
                  const isSelected = selectedPlan === plan;
                  return (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        "relative rounded-lg border-2 p-4 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <Badge className={cn("mb-2", info.colorClass)}>{info.badge}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Verification Checklist
              </h4>
              <div className="space-y-3 pl-6">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="payment-verified"
                    checked={checklist.paymentVerified}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({ ...prev, paymentVerified: checked as boolean }))
                    }
                  />
                  <Label htmlFor="payment-verified" className="cursor-pointer">
                    Payment amount verified
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="payment-received"
                    checked={checklist.paymentReceived}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({ ...prev, paymentReceived: checked as boolean }))
                    }
                  />
                  <Label htmlFor="payment-received" className="cursor-pointer">
                    Payment received in bank account
                  </Label>
                </div>
              </div>
            </div>

            {/* Subscription Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Subscription Settings
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subscription Type</Label>
                  <Select value={subscriptionType} onValueChange={setSubscriptionType}>
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
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={subscriptionStartDate}
                    onChange={(e) => setSubscriptionStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Renewal date will be: <span className="font-medium">{format(new Date(calculateRenewalDate()), "MMM d, yyyy")}</span>
              </div>
            </div>

            {!canActivate && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                Complete all verification steps to activate
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleActivate} disabled={loading || !canActivate}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Activate Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
