import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Loader2, CheckCircle } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    // Check hash for type=recovery (handles page refresh)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
      setChecking(false);
    }

    // Check for PKCE flow tokens (?code=... query parameter)
    const params = new URLSearchParams(window.location.search);
    if (params.has("code")) {
      // PKCE flow: Supabase client will exchange the code automatically
      // Give it time to process
      setIsRecovery(true);
      setChecking(false);
    }

    // Allow up to 3 seconds for the auth client to process the recovery token
    const timeout = setTimeout(() => {
      setChecking(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast.error("Failed to reset password", { description: error.message });
      return;
    }

    // Send security alert email (fire-and-forget)
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'security-alert',
          recipientEmail: user.email,
          idempotencyKey: `password-changed-${user.id}-${Date.now()}`,
          templateData: {
            alertType: 'Password Changed',
            description: 'Your account password was successfully changed. If you did not make this change, please contact support immediately.',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            actionUrl: 'https://edzenai.com/admin',
            actionLabel: 'Go to Dashboard',
          },
        },
      }).catch(err => console.warn('Security alert email failed:', err));
    }

    setSuccess(true);
    setTimeout(() => navigate("/login", { replace: true }), 2000);
  };

  // Show loading spinner while checking for recovery token
  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isRecovery && !success) {
    return (
      <div className="min-h-[100dvh] flex items-start pt-8 sm:items-center sm:pt-0 justify-center bg-background px-4 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border/50 shadow-card">
            <CardHeader className="text-center">
              <CardTitle>Invalid or expired link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/forgot-password")}>
                Request New Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-start pt-8 sm:items-center sm:pt-0 justify-center bg-background px-4 overflow-y-auto">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <img src={edzenIcon} alt="EdZen AI" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">EdZen AI</h1>
        </div>

        <Card className="border-border/50 shadow-card">
          <CardHeader className="text-center">
            <CardTitle>{success ? "Password updated!" : "Set new password"}</CardTitle>
            <CardDescription>
              {success
                ? "Redirecting you to login..."
                : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className={confirmPassword && password !== confirmPassword ? "border-destructive focus-visible:ring-destructive" : confirmPassword && password === confirmPassword ? "border-emerald-500 focus-visible:ring-emerald-500" : ""}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-emerald-600">Passwords match</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
