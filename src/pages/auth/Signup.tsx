import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GraduationCap, Loader2, ArrowLeft, ArrowRight, Check, Shield, Sparkles, Mail, RefreshCw } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";
import { PasswordInput } from "@/components/ui/password-input";
import { PLAN_DISPLAY, type SubscriptionPlan } from "@/config/plan-features";
import { cn } from "@/lib/utils";
import { useSubscriptionPricing, DEFAULT_STARTER_RATE, DEFAULT_PRO_RATE } from "@/hooks/useSubscriptionPricing";
import { SchoolAutocomplete } from "@/components/ui/school-autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/indian-states";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Signup() {
  usePageMeta({
    title: "Start Free Trial – EdZen AI School Management",
    description: "Sign up for EdZen AI's 30-day free Pro trial. No credit card required. Manage fees, attendance, and AI-powered student progress.",
    canonical: "/signup",
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Referral code from ?ref=
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrerName, setReferrerName] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;
    const upper = code.trim().toUpperCase();
    (supabase as any).rpc("resolve_referral_code", { _code: upper }).then(({ data }: any) => {
      if (data && data.length > 0) {
        setReferralCode(data[0].referral_code);
        setReferrerName(data[0].name);
      }
    });
  }, []);

  // Step 1 fields
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("plan") === "starter" ? "starter" : "pro";
  });
  const { data: pricing } = useSubscriptionPricing();
  const starterRate = pricing?.find(p => p.plan === 'starter')?.per_student_fee ?? DEFAULT_STARTER_RATE;
  const proRate = pricing?.find(p => p.plan === 'pro')?.per_student_fee ?? DEFAULT_PRO_RATE;
  const isProTrial = selectedPlan === 'pro';

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !city || !stateName || !adminName || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: adminName,
            phone,
            school_name: schoolName,
            city,
            state: stateName,
            selected_plan: selectedPlan,
            referral_code: referralCode || null,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email resent!");
      }
    } catch {
      toast.error("Failed to resend email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-start pt-8 sm:items-center sm:pt-0 justify-center bg-background px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <img src={edzenIcon} alt="EdZen AI" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">
            {step === 3 ? "Check your email" : isProTrial ? "Start your Pro free trial" : "Get started with Starter"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {step === 3
              ? "We've sent a verification link to your inbox"
              : isProTrial
                ? "No credit card required · Full Pro access for 30 days"
                : "No credit card required · Core features for your school"}
          </p>
          {referrerName && (
            <Badge variant="outline" className="mt-3 bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
              ✨ Referred by {referrerName}
            </Badge>
          )}
        </div>

        {/* Step indicator */}
        {step !== 3 && (
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
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>School & Admin Details</CardTitle>
              <CardDescription>Tell us about your school to get started</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google Sign-up */}
              <div className="space-y-4 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignup}
                  disabled={oauthLoading || loading}
                >
                  {oauthLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <SchoolAutocomplete
                    id="schoolName"
                    value={schoolName}
                    onChange={setSchoolName}
                    onPlaceSelected={({ name, city: c, state: s }) => {
                      setSchoolName(name);
                      if (c) setCity(c);
                      if (s) setStateName(s);
                    }}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Mumbai" value={city} onChange={(e) => setCity(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select value={stateName} onValueChange={setStateName}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input id="adminName" placeholder="Your full name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="admin@school.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput id="confirmPassword" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={confirmPassword && password !== confirmPassword ? "border-destructive focus-visible:ring-destructive" : confirmPassword && password === confirmPassword ? "border-emerald-500 focus-visible:ring-emerald-500" : ""} />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-emerald-600">Passwords match</p>
                  )}
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
                        Most Popular
                      </Badge>
                    )}
                    {isPro && (
                      <p className="text-xs text-primary font-medium mt-1">30-day free trial</p>
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
                        <span className="text-2xl font-bold">₹{isPro ? proRate : starterRate}</span>
                        <span className="text-muted-foreground text-sm">/ student / month</span>
                      </div>
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
              <Button onClick={handleSignup} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProTrial ? 'Start Pro Trial' : 'Create Account'}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {isProTrial ? 'No credit card required · Cancel anytime · 30-day Pro trial' : 'No credit card required · Cancel anytime'}
            </div>
          </div>
        )}

        {/* Step 3: Email Verification Pending */}
        {step === 3 && (
          <Card className="border-border/50 shadow-card">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Verification email sent!</h2>
                <p className="text-muted-foreground">
                  We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                  Click the link to activate your account and start your free trial.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                <p>📧 Can't find the email? Check your <span className="font-medium">spam or junk folder</span>.</p>
                <p>⏱️ The link will expire in 24 hours.</p>
              </div>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resending}
                className="gap-2"
              >
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Resend verification email
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
