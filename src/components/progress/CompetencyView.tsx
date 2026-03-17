import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useStudentCompetencyScores, type MasteryLevel } from "@/hooks/progress/useCompetencyScores";
import { Target } from "lucide-react";

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; variant: "destructive" | "secondary" | "default" | "outline"; className: string }> = {
  beginning: { label: "Beginning", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/30" },
  developing: { label: "Developing", variant: "secondary", className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  proficient: { label: "Proficient", variant: "default", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  advanced: { label: "Advanced", variant: "outline", className: "bg-primary/10 text-primary border-primary/30" },
};

interface CompetencyViewProps {
  studentId: string;
}

export function CompetencyView({ studentId }: CompetencyViewProps) {
  const { data: scores = [], isLoading } = useStudentCompetencyScores(studentId);

  const grouped = useMemo(() => {
    const map = new Map<string, { subjectName: string; competencies: Array<{ name: string; level: MasteryLevel; assessmentCount: number }> }>();
    
    // Group by subject → competency, taking the latest mastery level
    const compMap = new Map<string, { name: string; subjectName: string; level: MasteryLevel; count: number }>();
    
    scores.forEach((s: any) => {
      const compId = s.competency_id;
      const existing = compMap.get(compId);
      if (!existing || new Date(s.created_at) > new Date(existing.level)) {
        compMap.set(compId, {
          name: s.competencies?.name || 'Unknown',
          subjectName: s.competencies?.subjects?.name || 'Unknown',
          level: s.mastery_level as MasteryLevel,
          count: (existing?.count || 0) + 1,
        });
      } else {
        compMap.set(compId, { ...existing, count: existing.count + 1 });
      }
    });

    compMap.forEach((val) => {
      if (!map.has(val.subjectName)) {
        map.set(val.subjectName, { subjectName: val.subjectName, competencies: [] });
      }
      map.get(val.subjectName)!.competencies.push({
        name: val.name,
        level: val.level,
        assessmentCount: val.count,
      });
    });

    return Array.from(map.values());
  }, [scores]);

  if (isLoading) {
    return <div className="h-32 bg-muted animate-pulse rounded" />;
  }

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No competency data"
        description="Competency scores will appear here once teachers assess mastery levels."
      />
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(group => (
        <Card key={group.subjectName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group.subjectName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {group.competencies.map((comp, idx) => {
                const config = MASTERY_CONFIG[comp.level];
                return (
                  <div key={idx} className={`p-3 rounded-md border ${config.className}`}>
                    <p className="font-medium text-sm">{comp.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <Badge variant={config.variant} className="text-xs">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {comp.assessmentCount} assessment{comp.assessmentCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
