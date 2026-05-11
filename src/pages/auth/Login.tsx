import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { GraduationCap, Loader2, Mail, RefreshCw } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";
import { PasswordInput } from "@/components/ui/password-input";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { signIn, signInWithOAuth, user, session } = useAuth();
  const navigate = useNavigate();

  usePageMeta({
    title: "Sign In – EdZen AI School Management",
    description: "Sign in to EdZen AI to manage school fees, student progress, attendance, and NEP 2020 report cards.",
    canonical: "/login",
  });

  // Role-based redirection when session is detected
  useEffect(() => {
    if (!session || !user) return;

    // Check if email is verified — block unverified users immediately
    if (!user.email_confirmed_at) {
      setUnverifiedEmail(user.email || null);
      toast.error("Please verify your email before signing in.");
      supabase.auth.signOut();
      return;
    }
    
    // Clear any previous unverified state
    setUnverifiedEmail(null);

    const redirectByRole = async () => {
      // Block access if school is admin-blocked (suspicious activity lockout)
      const { data: blockedData } = await (supabase as any).rpc('current_user_blocked_school');
      const blockedRow = Array.isArray(blockedData) ? blockedData[0] : blockedData;
      if (blockedRow) {
        const reason = blockedRow.reason || 'Access has been blocked due to suspicious activity.';
        toast.error(`Login blocked: ${reason}`, { duration: 8000 });
        await supabase.auth.signOut();
        return;
      }

      const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
      if (isPlatformAdmin) {
        navigate("/platform", { replace: true });
        return;
      }

      // Check partner
      const { data: partner } = await (supabase as any)
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (partner) {
        navigate("/partner", { replace: true });
        return;
      }

      const { data: schoolAdmin } = await supabase
        .from('school_admins')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (schoolAdmin) {
        navigate("/admin", { replace: true });
        return;
      }

      const { data: staffMember } = await supabase
        .from('school_teachers')
        .select('school_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffMember) {
        const staffRole = (staffMember as any).role || 'teacher';
        if (staffRole === 'accountant') {
          navigate("/admin", { replace: true });
        } else {
          navigate("/progress", { replace: true });
        }
        return;
      }

      // Verified user with no role — check if they have school metadata from signup
      const meta = user.user_metadata;
      if (meta?.school_name) {
        // Auto-activate school from signup metadata
        try {
          const { data, error } = await supabase.functions.invoke("onboard-school", {
            body: {
              schoolName: meta.school_name,
              adminName: meta.full_name || "",
              phone: meta.phone || "",
              selectedPlan: meta.selected_plan || "starter",
            },
          });

          if (error || !data?.success) {
            console.error("Auto-activate failed:", data?.error || error?.message);
            toast.error("School setup failed. Please try again.");
            navigate("/onboard", { replace: true });
            return;
          }

          toast.success("Welcome! Your 30-day free trial has started 🎉");
          navigate("/admin/getting-started", { replace: true });
          return;
        } catch (err) {
          console.error("Auto-activate error:", err);
          navigate("/onboard", { replace: true });
          return;
        }
      }

      // No metadata — OAuth user needs manual onboarding
      navigate("/onboard", { replace: true });
    };

    redirectByRole();
  }, [session, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);

    const { error } = await signIn(email, password);

    if (error) {
      // Supabase returns "Email not confirmed" for unverified users
      if (error.message?.toLowerCase().includes("email not confirmed")) {
        setUnverifiedEmail(email);
        setLoading(false);
        return;
      }
      toast.error("Login failed", { description: error.message });
      setLoading(false);
      return;
    }

    // Redirection will be handled by the useEffect above
  };

  const handleOAuth = async (provider: 'google') => {
    setOauthLoading(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast.error(`Sign in with ${provider} failed`, { description: error.message });
      setOauthLoading(null);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: unverifiedEmail,
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
    <div className="min-h-[100dvh] flex items-start pt-8 sm:items-center sm:pt-0 justify-center bg-background px-4 overflow-y-auto">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <img src={edzenIcon} alt="EdZen AI" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">EdZen AI</h1>
          <p className="text-muted-foreground mt-1">Fee Transparency & Student Progress Analysis</p>
        </div>

        {/* Unverified email banner */}
        {unverifiedEmail && (
          <Card className="border-destructive/30 bg-destructive/5 mb-4">
            <CardContent className="pt-4 pb-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <Mail className="h-5 w-5" />
                <span className="font-medium text-sm">Email not verified</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Please verify your email to activate your account. Check your inbox (and spam folder) for the verification link.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={resending}
                className="gap-2"
              >
                {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Resend verification email
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 shadow-card">
          <CardHeader className="text-center">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading || loading}
              >
                {oauthLoading === 'google' ? (
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
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !!oauthLoading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-3">
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link to="/signup">
              Start Free Trial — No Credit Card Required
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
