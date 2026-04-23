import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Trash2, Mail, Sparkles, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useLifecycleStage } from "@/hooks/useLifecycleStage";
import { useAuth } from "@/contexts/AuthContext";
import edzenIcon from "@/assets/edzen-icon.png";

interface SuspendedScreenProps {
  schoolName?: string;
}

export function SuspendedScreen({ schoolName }: SuspendedScreenProps) {
  const { stage, daysIntoExpiry, daysRemainingInStage } = useLifecycleStage();
  const { signOut } = useAuth();

  const isTerminated = stage === 'terminated';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${isTerminated ? "bg-destructive/15" : "bg-amber-500/15"}`}>
              {isTerminated ? <Trash2 className="h-10 w-10 text-destructive" /> : <ShieldAlert className="h-10 w-10 text-amber-600" />}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <img src={edzenIcon} alt="EdZen AI" className="h-4 w-4" />
              <span>EdZen AI</span>
            </div>
            <h1 className="text-2xl font-bold">
              {isTerminated ? "Account Scheduled for Deletion" : "Service Paused"}
            </h1>
            {schoolName && <p className="text-sm text-muted-foreground">{schoolName}</p>}
          </div>

          <div className="text-muted-foreground space-y-3">
            {isTerminated ? (
              <>
                <p>Your account has been marked for deletion after being inactive for {daysIntoExpiry}+ days.</p>
                <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-lg">
                  All school data will be permanently deleted in {daysRemainingInStage} days. Contact support immediately to restore.
                </p>
              </>
            ) : (
              <>
                <p>Your subscription expired {daysIntoExpiry} days ago and access has been suspended.</p>
                <p className="text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg">
                  ✅ Your data is safe and preserved. Renew anytime to restore full access.
                </p>
                {daysRemainingInStage > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Account will be marked for deletion in {daysRemainingInStage} days if no action is taken.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {!isTerminated && (
              <Button size="lg" asChild className="w-full">
                <Link to="/pricing"><Sparkles className="h-4 w-4 mr-2" />Renew Now</Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild className="w-full">
              <a href="mailto:support@edzenai.com"><Mail className="h-4 w-4 mr-2" />Contact Support</a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground">
              <LogOut className="h-3.5 w-3.5 mr-2" />Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
