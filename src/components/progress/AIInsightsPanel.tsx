import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Target, TrendingUp, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import type { StudentInsights, ClassInsights } from '@/hooks/progress/useAIAnalysis';

interface AIInsightsPanelProps {
  insights: StudentInsights | ClassInsights | null;
  isLoading?: boolean;
  onGenerate?: () => void;
  type: 'student' | 'class';
  hasData?: boolean;
}

export function AIInsightsPanel({ 
  insights, 
  isLoading = false, 
  onGenerate,
  type,
  hasData = true
}: AIInsightsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights && onGenerate) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              {hasData 
                ? `Get AI-powered insights for this ${type === 'student' ? 'student' : 'class'}`
                : `No data available for analysis`
              }
            </p>
            {hasData && (
              <Button onClick={onGenerate} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate AI Insights
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  // Student insights
  if (type === 'student' && 'riskLevel' in insights) {
    const studentInsights = insights as StudentInsights;
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Analysis
            </CardTitle>
            <Badge 
              variant={studentInsights.riskLevel === 'high' ? 'destructive' : 
                       studentInsights.riskLevel === 'medium' ? 'secondary' : 'outline'}
            >
              {studentInsights.riskLevel === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {studentInsights.riskLevel === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
              {studentInsights.riskLevel} risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{studentInsights.summary}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm mb-2">
                <TrendingUp className="h-4 w-4" />
                Strengths
              </div>
              <ul className="space-y-1">
                {studentInsights.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-emerald-800 dark:text-emerald-300">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm mb-2">
                <Target className="h-4 w-4" />
                Focus Areas
              </div>
              <ul className="space-y-1">
                {studentInsights.improvements.map((improvement, idx) => (
                  <li key={idx} className="text-sm text-amber-800 dark:text-amber-300">
                    • {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Priority Subject */}
          {(studentInsights.prioritySubject || studentInsights.focusSubject) && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <Target className="h-4 w-4" />
                Priority Subject: {studentInsights.prioritySubject || studentInsights.focusSubject}
              </div>
            </div>
          )}

          {/* Suggested Teacher Actions */}
          {studentInsights.suggestedTeacherActions && studentInsights.suggestedTeacherActions.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium text-sm mb-2">
                <Lightbulb className="h-4 w-4" />
                Suggested Teacher Actions
              </div>
              <ul className="space-y-1">
                {studentInsights.suggestedTeacherActions.map((action, idx) => (
                  <li key={idx} className="text-sm text-blue-800 dark:text-blue-300">
                    {idx + 1}. {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-foreground font-medium text-sm mb-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </div>
            <ul className="space-y-1">
              {studentInsights.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  {idx + 1}. {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Parent Communication Tips */}
          {studentInsights.parentCommunicationTips && studentInsights.parentCommunicationTips.length > 0 && (
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-medium text-sm mb-2">
                <MessageCircle className="h-4 w-4" />
                Parent Communication Tips
              </div>
              <ul className="space-y-1">
                {studentInsights.parentCommunicationTips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-purple-800 dark:text-purple-300">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Class insights
  if (type === 'class' && 'topPerformers' in insights) {
    const classInsights = insights as ClassInsights;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Class AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{classInsights.summary}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Performers */}
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm mb-2">
                <TrendingUp className="h-4 w-4" />
                Top Performers
              </div>
              <ul className="space-y-1">
                {classInsights.topPerformers.map((name, idx) => (
                  <li key={idx} className="text-sm text-emerald-800 dark:text-emerald-300">
                    • {name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Needs Attention */}
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Needs Attention
              </div>
              <ul className="space-y-1">
                {classInsights.needsAttention.length > 0 ? (
                  classInsights.needsAttention.map((name, idx) => (
                    <li key={idx} className="text-sm text-red-800 dark:text-red-300">
                      • {name}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-red-800 dark:text-red-300">No students flagged</li>
                )}
              </ul>
            </div>
          </div>

          {/* Subject Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Hardest Subject</p>
              <p className="font-medium">{classInsights.hardestSubject}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Easiest Subject</p>
              <p className="font-medium">{classInsights.easiestSubject}</p>
            </div>
          </div>

          {/* Teaching Recommendations */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-primary font-medium text-sm mb-2">
              <Lightbulb className="h-4 w-4" />
              Teaching Strategies
            </div>
            <ul className="space-y-1">
              {classInsights.classRecommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-foreground">
                  {idx + 1}. {rec}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
