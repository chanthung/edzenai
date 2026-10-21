import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimetableConfig } from "./TimetableConfigContext";
import { useTimetableReadiness } from "@/hooks/timetable/useTimetableReadiness";
import type { CheckStatus, FixTarget, ReadinessResult } from "@/lib/timetable-readiness";

const STATUS: Record<CheckStatus, { icon: typeof CheckCircle2; text: string; cls: string }> = {
  ok: { icon: CheckCircle2, text: "OK", cls: "text-emerald-600" },
  warn: { icon: AlertTriangle, text: "Needs attention", cls: "text-amber-600" },
  unknown: { icon: HelpCircle, text: "Unable to verify", cls: "text-destructive" },
};

const OVERALL: Record<ReadinessResult["overall"], { label: string; text: string; cls: string }> = {
  ready: { label: "Ready for generation", text: "All checks pass and confirmed periods fit the week.", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  attention: { label: "Needs attention", text: "Fix the items below before generating a realistic timetable.", cls: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  unknown: { label: "Unable to verify", text: "Some information could not be read, so readiness can't be confirmed.", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

function FixButton({ fix, onTab }: { fix: FixTarget; onTab: (t: string) => void }) {
  if (fix.kind === "link")
    return (
      <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
        <Link to={fix.to}>{fix.label}<ArrowRight className="h-3 w-3 ml-1" /></Link>
      </Button>
    );
  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onTab(fix.tab)}>
      {fix.label}<ArrowRight className="h-3 w-3 ml-1" />
    </Button>
  );
}

export function ReadinessSection({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { schoolId, academicYearId } = useTimetableConfig();
  const r = useTimetableReadiness(schoolId, academicYearId);
  const [showAll, setShowAll] = useState(false);

  if (r.isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;
  const o = OVERALL[r.overall];
  const rows = r.capacity ?? [];
  const visible = showAll ? rows : rows.slice(0, 12);

  return (
    <div className="space-y-5">
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base">Timetable readiness</CardTitle>
            <Badge variant="outline" className={cn("font-medium", o.cls)}>{o.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{o.text}</p>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {r.checks.map((c) => {
              const s = STATUS[c.status];
              const Icon = s.icon;
              return (
                <li key={c.id} className="px-4 py-3">
                  <Collapsible>
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", s.cls)} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <span className="text-sm font-medium">{c.title}</span>
                          <span className={cn("text-xs", s.cls)}>{s.text}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.summary}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {c.details.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              Details<ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </CollapsibleTrigger>
                        )}
                        {c.fix && c.status !== "ok" && <FixButton fix={c.fix} onTab={onNavigate} />}
                      </div>
                    </div>
                    <CollapsibleContent>
                      <ul className="mt-2 ml-7 list-disc pl-4 text-xs text-muted-foreground space-y-1">
                        {c.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weekly capacity</CardTitle>
          <p className="text-sm text-muted-foreground">
            {r.availablePerWeek == null
              ? "Unable to verify"
              : `${r.availablePerWeek} teaching periods available per class each week. Only confirmed subject periods count as required; drafts are shown separately.`}
          </p>
        </CardHeader>
        {rows.length > 0 && (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Draft (unconfirmed)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right">{row.required}</TableCell>
                      <TableCell className="text-right">{row.available}</TableCell>
                      <TableCell className={cn("text-right", row.remaining < 0 && "text-destructive font-medium")}>
                        {row.remaining < 0 ? `${-row.remaining} over` : row.remaining}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{row.draft}</TableCell>
                      <TableCell>
                        {row.status === "fits" && <span className="text-xs text-emerald-600">Fits</span>}
                        {row.status === "over" && <span className="text-xs text-destructive">Exceeds week</span>}
                        {row.status === "none" && <span className="text-xs text-amber-600">No confirmed periods</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 12 && (
              <div className="p-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                  {showAll ? "Show fewer" : `Show all ${rows.length} classes`}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
