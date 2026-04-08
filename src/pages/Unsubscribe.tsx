import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, CheckCircle, XCircle, MailX } from "lucide-react";
import edzenIcon from "@/assets/edzen-icon.png";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <img src={edzenIcon} alt="EdZen AI" className="h-7 w-7 object-contain" />
          </div>
          <CardTitle className="text-xl">EdZen AI</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Validating your request...</p>
            </>
          )}

          {status === "valid" && (
            <>
              <MailX className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Click below to unsubscribe from EdZen AI notification emails.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-10 w-10 mx-auto text-green-500" />
              <p className="font-medium">You've been unsubscribed</p>
              <p className="text-sm text-muted-foreground">
                You will no longer receive notification emails from EdZen AI. Important account-related emails (like password resets) will still be delivered.
              </p>
            </>
          )}

          {status === "already_unsubscribed" && (
            <>
              <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-medium">Already unsubscribed</p>
              <p className="text-sm text-muted-foreground">
                This email address was already unsubscribed from our notifications.
              </p>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="h-10 w-10 mx-auto text-destructive" />
              <p className="font-medium">
                {status === "invalid" ? "Invalid or expired link" : "Something went wrong"}
              </p>
              <p className="text-sm text-muted-foreground">
                {status === "invalid"
                  ? "This unsubscribe link is invalid or has expired. Please contact support if you need assistance."
                  : "We couldn't process your request. Please try again later."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
