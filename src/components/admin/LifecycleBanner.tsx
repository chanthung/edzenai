import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Sparkles, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useLifecycleStage } from "@/hooks/useLifecycleStage";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export function LifecycleBanner() {
  const { stage, daysIntoExpiry, daysRemainingInStage, isGrace, isWarning } = useLifecycleStage();
  const { effectiveState, daysRemaining, currentPlan } = useSubscriptionStatus();

  // Active subscription — no banner
  if (effectiveState === 'subscription_active') return null;

  // Trial active with countdown
  if (effectiveState === 'trial_active' && daysRemaining !== null && daysRemaining > 0) {
    const isUrgent = daysRemaining <= 7;
    return (
      <Card className={isUrgent ? "border-amber-500/40 bg-amber-500/5" : "border-primary/30 bg-primary/5"}>
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isUrgent ? "bg-amber-500/10" : "bg-primary/10"}`}>
              {isUrgent ? <Clock className="h-5 w-5 text-amber-600" /> : <Sparkles className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <p className="font-medium">🚀 Pro Trial Active — {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</p>
              <p className="text-sm text-muted-foreground">Full Pro access included. {isUrgent && 'Renew soon to avoid interruption.'}</p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link to="/pricing"><Sparkles className="h-3.5 w-3.5 mr-1" />Renew Now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Grace period — soft yellow
  if (isGrace) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">⏰ Subscription expired {daysIntoExpiry} day{daysIntoExpiry !== 1 ? 's' : ''} ago</p>
              <p className="text-sm text-muted-foreground">{daysRemainingInStage} day{daysRemainingInStage !== 1 ? 's' : ''} of full access remaining. Renew now to continue without interruption.</p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link to="/pricing"><Sparkles className="h-3.5 w-3.5 mr-1" />Renew Now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Warning phase — red
  if (isWarning) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">⚠️ Limited Access Mode — {daysRemainingInStage} day{daysRemainingInStage !== 1 ? 's' : ''} until suspension</p>
              <p className="text-sm text-muted-foreground">Teachers and accountants are locked out. Renew now to restore full access.</p>
            </div>
          </div>
          <Button size="sm" variant="destructive" asChild>
            <Link to="/pricing"><Sparkles className="h-3.5 w-3.5 mr-1" />Renew Immediately</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Fallback for legacy expired states
  if (effectiveState === 'trial_expired' || effectiveState === 'restricted_mode') {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">Subscription expired</p>
              <p className="text-sm text-muted-foreground">Renew now to restore full access to your school.</p>
            </div>
          </div>
          <Button size="sm" variant="destructive" asChild>
            <Link to="/pricing"><Sparkles className="h-3.5 w-3.5 mr-1" />Renew Now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
