import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, AlertTriangle } from "lucide-react";

export function TrialBanner() {
  const { effectiveState, daysRemaining, currentPlan, isRestricted } = useSubscriptionStatus();

  if (effectiveState === "subscription_active") return null;

  const isExpired = effectiveState === "trial_expired" || effectiveState === "restricted_mode";

  return (
    <Card className={isExpired
      ? "border-destructive/50 bg-destructive/5"
      : "border-primary/30 bg-primary/5"
    }>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isExpired ? "bg-destructive/10" : "bg-primary/10"
            }`}>
              {isExpired ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              {isExpired ? (
                <>
                  <p className="font-medium text-destructive">Your trial has ended</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to continue using the system. Data is safe.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">
                    🎉 Your 30-day free trial is active
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {daysRemaining !== null && daysRemaining > 0
                      ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`
                      : "Expires today"}
                    <Badge variant="outline" className="text-xs capitalize">
                      {currentPlan} plan
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
          <Button size="sm" variant={isExpired ? "destructive" : "default"} asChild>
            <Link to="/pricing">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Upgrade Now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}