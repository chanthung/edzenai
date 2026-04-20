import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";

type InviteState =
  | { status: "loading" }
  | { status: "valid"; email: string; name: string; role: string; schoolName?: string }
  | { status: "invalid"; reason: "invalid" | "expired" | "used" | "missing" };

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [invite, setInvite] = useState<InviteState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvite({ status: "invalid", reason: "missing" });
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("accept-user-invite", {
          method: "GET",
          // pass token via query string
          body: undefined,
          headers: {},
        } as any);
        // supabase.functions.invoke doesn't easily support GET query params,
        // so use fetch directly
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/accept-user-invite?token=${encodeURIComponent(token)}`,
          { method: "GET", headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const json = await res.json();
        if (json.valid) {
          setInvite({
            status: "valid",
            email: json.email,
            name: json.name,
            role: json.role,
            schoolName: json.schoolName,
          });
        } else {
          setInvite({ status: "invalid", reason: json.reason || "invalid" });
        }
      } catch (err) {
        console.error("Validate invite failed:", err);
        setInvite({ status: "invalid", reason: "invalid" });
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invite.status !== "valid") return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/accept-user-invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token, password }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to accept invite");
      }

      // Auto sign-in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password,
      });
      if (signInErr) throw signInErr;

      setSuccess(true);
      toast.success("Account activated!");

      setTimeout(() => {
        navigate(invite.role === "teacher" ? "/progress" : "/admin", { replace: true });
      }, 1500);
    } catch (err: any) {
      toast.error("Failed to activate account", { description: err.message });
    } finally {
      setSubmitting(false);
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
        </div>

        <Card className="border-border/50 shadow-card">
          {invite.status === "loading" && (
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Verifying your invite...</p>
            </CardContent>
          )}

          {invite.status === "invalid" && (
            <>
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-2">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle>
                  {invite.reason === "expired" && "Invite expired"}
                  {invite.reason === "used" && "Invite already used"}
                  {invite.reason === "invalid" && "Invalid invite link"}
                  {invite.reason === "missing" && "Missing invite token"}
                </CardTitle>
                <CardDescription>
                  {invite.reason === "expired" && "This invite link has expired. Please ask your school admin to send a new one."}
                  {invite.reason === "used" && "This invite has already been accepted. Please sign in instead."}
                  {invite.reason === "invalid" && "This invite link is invalid. Please ask your school admin to send a fresh one."}
                  {invite.reason === "missing" && "No invite token was provided in the URL."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate("/login")}>
                  Go to Sign In
                </Button>
              </CardContent>
            </>
          )}

          {invite.status === "valid" && !success && (
            <>
              <CardHeader className="text-center">
                <CardTitle>Welcome, {invite.name}!</CardTitle>
                <CardDescription>
                  You've been invited to join{" "}
                  <strong>{invite.schoolName || "your school"}</strong> as a{" "}
                  <strong>{invite.role === "accountant" ? "Accountant" : "Teacher"}</strong>.
                  Set a password to activate your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={invite.email} readOnly disabled className="pl-10 bg-muted/50" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <PasswordInput
                      id="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm Password</Label>
                    <PasswordInput
                      id="confirm"
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={8}
                      className={
                        confirm && password !== confirm
                          ? "border-destructive focus-visible:ring-destructive"
                          : confirm && password === confirm
                          ? "border-emerald-500 focus-visible:ring-emerald-500"
                          : ""
                      }
                    />
                    {confirm && password !== confirm && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                    {confirm && password === confirm && (
                      <p className="text-xs text-emerald-600">Passwords match</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Activate Account
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {success && (
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <p className="font-medium mb-1">Account activated!</p>
              <p className="text-sm text-muted-foreground">Signing you in…</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
