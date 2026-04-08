import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GraduationCap, Loader2, ArrowLeft, ArrowRight, Check, Shield, Sparkles } from "lucide-react";
import { PLAN_DISPLAY, type SubscriptionPlan } from "@/config/plan-features";
import { cn } from "@/lib/utils";

export default function Onboard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  // Pre-fill from Google profile
  const [schoolName, setSchoolName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("pro");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    // Pre-fill from user metadata
    setAdminName(user.user_metadata?.full_name || user.user_metadata?.name || "");
  }, [user, navigate]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName) {
      toast.error("Please enter your school name");
      return;
    }
    setStep(2);
  };

  const handleOnboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("onboard-school", {
        body: { schoolName, adminName, phone, selectedPlan },
      });

      if (error || !data?.success) {
        toast.error(data?.error || error?.message || "Setup failed");
        setLoading(false);
        return;
      }

      toast.success(selectedPlan === 'pro' ? "Welcome! Your 30-day Pro trial has started 🚀" : "Welcome! Your Starter plan is active 🎉");
      navigate("/admin/getting-started", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] flex items-start pt-8 sm:items-center sm:pt-0 justify-center bg-background px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <img src={edzenIcon} alt="EdZen AI" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">Set up your school</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {adminName || user.email}! Complete your school profile to get started.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          )}>
            {step > 1 ? <Check className="h-4 w-4" /> : <span>1</span>}
            School Info
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            <span>2</span>
            Choose Plan
          </div>
        </div>

        {/* Step 1: School Info */}
        {step === 1 && (
          <Card className="border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>School & Admin Details</CardTitle>
              <CardDescription>Tell us about your school to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input id="schoolName" placeholder="Delhi Public School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Your Name</Label>
                  <Input id="adminName" placeholder="Your full name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">
                  Next — Choose Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Plan Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {(["starter", "pro"] as SubscriptionPlan[]).map((plan) => {
                const info = PLAN_DISPLAY[plan];
                const isSelected = selectedPlan === plan;
                const isPro = plan === "pro";

                return (
                  <Card
                    key={plan}
                    className={cn(
                      "cursor-pointer transition-all relative",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border/50 hover:border-primary/40"
                    )}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {isPro && (
                      <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Most Popular — 30 days free
                      </Badge>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{info.label}</CardTitle>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold">₹{isPro ? 8 : 5}</span>
                        <span className="text-muted-foreground text-sm">/ student / month</span>
                      </div>
                      {isPro && <p className="text-xs text-primary font-medium">30-day free trial</p>}
                      <CardDescription className="text-xs">{info.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {info.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleOnboard} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start {selectedPlan === 'pro' ? 'Pro Trial' : 'with Starter'}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {selectedPlan === 'pro' ? 'No credit card required · Cancel anytime · 30-day Pro trial' : 'No credit card required · Cancel anytime'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
