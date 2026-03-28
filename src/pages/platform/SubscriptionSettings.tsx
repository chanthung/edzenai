import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, LogOut, ArrowLeft, Save, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionPricing, useUpdateSubscriptionPricing } from "@/hooks/useSubscriptionPricing";
import { PLAN_DISPLAY, type SubscriptionPlan } from "@/config/plan-features";
import { cn } from "@/lib/utils";
import { VolumeDiscountEditor } from "@/components/platform/VolumeDiscountEditor";
import { PricingCalculator } from "@/components/platform/PricingCalculator";

export default function SubscriptionSettings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: pricing, isLoading: pricingLoading } = useSubscriptionPricing();
  const updatePricing = useUpdateSubscriptionPricing();

  const [formData, setFormData] = useState<Record<string, { per_student_fee: string; base_monthly_fee: string }>>({
    starter: { per_student_fee: "5", base_monthly_fee: "0" },
    pro: { per_student_fee: "8", base_monthly_fee: "0" },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      checkPlatformAdmin();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (pricing) {
      const updated: Record<string, { per_student_fee: string; base_monthly_fee: string }> = {};
      pricing.forEach((p) => {
        updated[p.plan] = {
          per_student_fee: String(p.per_student_fee),
          base_monthly_fee: String(p.base_monthly_fee),
        };
      });
      setFormData((prev) => ({ ...prev, ...updated }));
    }
  }, [pricing]);

  const checkPlatformAdmin = async () => {
    const { data } = await supabase.rpc("is_platform_admin");
    setIsPlatformAdmin(data);
    setLoading(false);
  };

  const handleSave = async (plan: string) => {
    const values = formData[plan];
    if (!values) return;

    const perStudent = parseFloat(values.per_student_fee);
    const baseFee = parseFloat(values.base_monthly_fee);

    if (isNaN(perStudent) || perStudent < 0) {
      toast.error("Invalid per-student fee");
      return;
    }
    if (isNaN(baseFee) || baseFee < 0) {
      toast.error("Invalid base fee");
      return;
    }

    try {
      await updatePricing.mutateAsync({
        plan,
        per_student_fee: perStudent,
        base_monthly_fee: baseFee,
      });
      toast.success(`${plan.charAt(0).toUpperCase() + plan.slice(1)} pricing updated`);
    } catch (error: any) {
      toast.error("Failed to update pricing", { description: error.message });
    }
  };

  if (authLoading || loading || pricingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const plans: SubscriptionPlan[] = ["starter", "pro"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/platform")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Subscription Settings</h1>
              <p className="text-sm text-muted-foreground">Manage plan pricing for all schools</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => { signOut(); navigate("/login"); }}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {plans.map((plan) => {
            const info = PLAN_DISPLAY[plan];
            const values = formData[plan];
            
            return (
              <Card key={plan}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={cn(info.colorClass)}>{info.badge}</Badge>
                      <div>
                        <CardTitle className="text-lg">{info.label} Plan</CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" />
                        Per Student Fee (monthly)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={values?.per_student_fee || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [plan]: { ...prev[plan], per_student_fee: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" />
                        Base Monthly Fee
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={values?.base_monthly_fee || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [plan]: { ...prev[plan], base_monthly_fee: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">
                      Example: A school with 100 students →{" "}
                      <span className="font-medium text-foreground">
                        ₹{(100 * parseFloat(values?.per_student_fee || "0") + parseFloat(values?.base_monthly_fee || "0")).toLocaleString("en-IN")}/month
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave(plan)}
                      disabled={updatePricing.isPending}
                      size="sm"
                    >
                      {updatePricing.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save {info.label} Pricing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 mt-8">
          <VolumeDiscountEditor />
          <PricingCalculator />
        </div>
      </main>
    </div>
  );
}
