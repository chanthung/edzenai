import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SubjectGap {
  subjectName: string;
  averagePercentage: number;
  trend: number;
  classAverage?: number;
}

interface LearningGapsCardProps {
  subjects: SubjectGap[];
  title?: string;
  classAverages?: Record<string, number>;
}

export function LearningGapsCard({ 
  subjects, 
  title = "Subject Analysis",
  classAverages = {}
}: LearningGapsCardProps) {
  if (subjects.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No subject data available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by percentage to show weakest first
  const sortedSubjects = [...subjects].sort((a, b) => a.averagePercentage - b.averagePercentage);
  const weakestSubjects = sortedSubjects.filter(s => s.averagePercentage < 60);
  const strongSubjects = sortedSubjects.filter(s => s.averagePercentage >= 80);

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage >= 60) return 'text-primary';
    if (percentage >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGapBadge = (percentage: number, classAvg?: number) => {
    if (classAvg && percentage < classAvg - 10) {
      return <Badge variant="destructive" className="text-xs">Below Class</Badge>;
    }
    if (percentage < 40) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    }
    if (percentage < 60) {
      return <Badge variant="secondary" className="text-xs">Needs Work</Badge>;
    }
    if (percentage >= 80) {
      return <Badge className="text-xs bg-emerald-600">Strong</Badge>;
    }
    return null;
  };

  const TrendIcon = ({ trend }: { trend: number }) => {
    if (trend >= 5) return <TrendingUp className="h-3 w-3 text-emerald-600" />;
    if (trend <= -5) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          {weakestSubjects.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {weakestSubjects.length} subject{weakestSubjects.length > 1 ? 's' : ''} need attention
            </Badge>
          )}
          {strongSubjects.length > 0 && (
            <Badge className="text-xs bg-emerald-600">
              {strongSubjects.length} strong subject{strongSubjects.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Subject list */}
        <div className="space-y-2">
          {sortedSubjects.map((subject, idx) => {
            const classAvg = classAverages[subject.subjectName];
            const belowClass = classAvg ? subject.averagePercentage < classAvg : false;
            
            return (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  subject.averagePercentage < 40 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{subject.subjectName}</span>
                  {getGapBadge(subject.averagePercentage, classAvg)}
                </div>
                <div className="flex items-center gap-3">
                  {classAvg && (
                    <span className={`text-xs ${belowClass ? 'text-red-600' : 'text-muted-foreground'}`}>
                      Class: {classAvg}%
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={subject.trend} />
                    <span className={`font-bold ${getPerformanceColor(subject.averagePercentage)}`}>
                      {subject.averagePercentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-emerald-600" /> ≥80% Strong
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-amber-500" /> 40-60% Needs Work
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-red-500" /> &lt;40% Critical
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
