import { useParentProgress } from '@/hooks/useParentProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PerformanceTrendChart } from '@/components/progress/charts/PerformanceTrendChart';
import { SubjectRadarChart } from '@/components/progress/charts/SubjectRadarChart';
import { SubjectComparisonChart } from '@/components/progress/charts/SubjectComparisonChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  BarChart3, 
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

interface ParentProgressTabProps {
  accessToken: string;
  studentName: string;
}

export function ParentProgressTab({ accessToken, studentName }: ParentProgressTabProps) {
  const { data, isLoading, error } = useParentProgress(accessToken);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);

  if (isLoading) {
    return <ProgressTabSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Unable to load progress data.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Academic Records Yet</h3>
          <p className="text-muted-foreground text-sm">
            Marks will appear here once assessments are recorded by the school.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, trendChartData, radarChartData, subjectBreakdown, assessments } = data;

  const getTrendIcon = () => {
    switch (summary.status) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusLabel = () => {
    switch (summary.status) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Needs Attention';
      case 'stable':
        return 'Stable';
      default:
        return 'New';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Overall Average</p>
            <p className="text-2xl font-bold text-primary">{summary.overallAverage}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Assessments</p>
            <p className="text-2xl font-bold">{summary.assessmentCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="font-semibold">{getStatusLabel()}</span>
            </div>
            {summary.trend !== 0 && summary.status !== 'new' && (
              <p className={`text-xs mt-1 ${summary.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.trend > 0 ? '+' : ''}{summary.trend}% from last
              </p>
            )}
          </CardContent>
        </Card>
        
        {summary.bestSubject && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Best Subject</p>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-sm truncate">{summary.bestSubject}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        {trendChartData.length > 1 && (
          <PerformanceTrendChart 
            data={trendChartData} 
            title="Performance Over Time"
          />
        )}
        
        {subjectBreakdown.length >= 3 ? (
          <SubjectRadarChart 
            data={radarChartData} 
            title="Subject Strengths"
            studentName={studentName}
          />
        ) : subjectBreakdown.length > 0 ? (
          <SubjectComparisonChart 
            data={subjectBreakdown.map(s => ({
              subject: s.name,
              percentage: s.averagePercentage,
            }))}
            title="Subject Performance"
          />
        ) : null}
      </div>

      {/* Assessment History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Assessment History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessments.map((assessment) => (
            <Collapsible
              key={assessment.id}
              open={expandedAssessment === assessment.id}
              onOpenChange={(open) => setExpandedAssessment(open ? assessment.id : null)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="text-left">
                    <p className="font-medium">{assessment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {assessment.type}
                      {assessment.date && ` • ${format(parseISO(assessment.date), 'dd MMM yyyy')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-bold ${
                        assessment.overallPercentage >= 75 ? 'text-green-600' :
                        assessment.overallPercentage >= 50 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {assessment.overallPercentage}%
                      </p>
                    </div>
                    {expandedAssessment === assessment.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-2 ml-3 space-y-2 animate-slide-up">
                  {assessment.subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between py-2 px-3 rounded bg-background border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{subject.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress 
                            value={subject.percentage} 
                            className="h-1.5 flex-1 max-w-[120px]"
                          />
                          <span className="text-xs text-muted-foreground">
                            {subject.marksObtained}/{subject.maxMarks}
                          </span>
                        </div>
                      </div>
                      <p className={`font-semibold ml-3 ${
                        subject.percentage >= 75 ? 'text-green-600' :
                        subject.percentage >= 50 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {subject.percentage}%
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
