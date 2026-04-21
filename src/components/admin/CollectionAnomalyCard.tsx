import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Lock } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AnomalyInsight {
  title: string;
  detail: string;
  action?: string;
  severity: "info" | "warning" | "critical";
}

interface AnomalyResponse {
  summary: string;
  insights: AnomalyInsight[];
  overall?: { this_month: number; last_month: number; change_pct: number };
}

interface Props {
  schoolId: string | undefined;
}

export function CollectionAnomalyCard({ schoolId }: Props) {
  const { canAccessFeature } = useSubscriptionStatus();
  const isPro = canAccessFeature("ai_student_insights"); // Pro-tier gate
  const [enabled, setEnabled] = useState(false);

  const { data, isLoading, isFetching, refetch, error } = useQuery<AnomalyResponse>({
    queryKey: ["collection-anomalies", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-collection-anomalies", {
        body: { school_id: schoolId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as AnomalyResponse;
    },
    enabled: !!schoolId && enabled && isPro,
    staleTime: 1000 * 60 * 30, // 30 min cache
    retry: false,
  });

  if (!isPro) {
    return (
      <Card className="card-elevated border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Collection Insights
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" /> Pro
            </Badge>
          </CardTitle>
          <CardDescription>
            Upgrade to Pro to surface collection drops, class-wise trend alerts, and suggested actions automatically.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleRun = () => {
    if (!enabled) setEnabled(true);
    else refetch();
  };

  const errorMessage = error instanceof Error ? error.message : null;
  if (errorMessage && enabled) {
    // surface once per fetch
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Collection Insights
          </CardTitle>
          <CardDescription>
            {data?.summary
              ? data.summary
              : "Spot collection drops, class-wise trends and anomalies vs last month."}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant={enabled ? "outline" : "default"}
          onClick={handleRun}
          disabled={!schoolId || isFetching}
        >
          {isFetching ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Analyzing
            </>
          ) : enabled ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Analyze
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!enabled && (
          <p className="text-sm text-muted-foreground">
            Click <strong>Analyze</strong> to scan the last 90 days of payments and surface what changed.
          </p>
        )}

        {enabled && isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {enabled && errorMessage && !isLoading && (
          <div className="text-sm text-destructive">
            Could not generate insights: {errorMessage}
          </div>
        )}

        {enabled && data && !isLoading && (
          <div className="space-y-3">
            {data.overall && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="text-sm">
                  <p className="text-muted-foreground">This month vs last</p>
                  <p className="font-semibold">
                    ₹{data.overall.this_month.toLocaleString("en-IN")} vs ₹
                    {data.overall.last_month.toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1",
                    data.overall.change_pct >= 0
                      ? "text-status-paid border-status-paid/30"
                      : "text-status-overdue border-status-overdue/30",
                  )}
                >
                  {data.overall.change_pct >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {data.overall.change_pct >= 0 ? "+" : ""}
                  {data.overall.change_pct}%
                </Badge>
              </div>
            )}

            {data.insights?.length ? (
              <ul className="space-y-2">
                {data.insights.map((ins, i) => (
                  <li
                    key={i}
                    className={cn(
                      "p-3 rounded-xl border text-sm",
                      ins.severity === "critical" &&
                        "border-status-overdue/40 bg-status-overdue/5",
                      ins.severity === "warning" &&
                        "border-status-partial/40 bg-status-partial/5",
                      ins.severity === "info" && "border-border bg-muted/30",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          ins.severity === "critical" && "text-status-overdue",
                          ins.severity === "warning" && "text-status-partial",
                          ins.severity === "info" && "text-muted-foreground",
                        )}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{ins.title}</p>
                        <p className="text-muted-foreground mt-0.5">{ins.detail}</p>
                        {ins.action && (
                          <p className="text-xs mt-1.5 text-foreground/80">
                            <span className="font-medium">Suggested:</span> {ins.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No significant anomalies detected. Collections look stable.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
