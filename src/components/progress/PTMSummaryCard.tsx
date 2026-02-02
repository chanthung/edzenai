import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Printer, Home, GraduationCap, Heart } from 'lucide-react';
import type { PTMSummary } from '@/hooks/progress/useAIAnalysis';

interface PTMSummaryCardProps {
  summary: PTMSummary | null;
  studentName: string;
  isLoading?: boolean;
  onGenerate?: () => void;
}

export function PTMSummaryCard({ 
  summary, 
  studentName,
  isLoading = false,
  onGenerate
}: PTMSummaryCardProps) {
  const handlePrint = () => {
    if (!summary) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PTM Summary - ${studentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 1.25rem; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 8px; }
            .greeting { font-weight: 500; margin-bottom: 16px; }
            .section { margin-bottom: 16px; padding: 12px; border-radius: 8px; }
            .section-title { font-weight: 600; font-size: 0.875rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
            .section-content { font-size: 0.875rem; line-height: 1.5; }
            .overall { background: #f3f4f6; }
            .strengths { background: #d1fae5; border: 1px solid #a7f3d0; }
            .strengths .section-title { color: #047857; }
            .improvements { background: #fef3c7; border: 1px solid #fde68a; }
            .improvements .section-title { color: #b45309; }
            .home-support { background: #dbeafe; border: 1px solid #bfdbfe; }
            .home-support .section-title { color: #1d4ed8; }
            .teacher-note { background: #f3e8ff; border: 1px solid #e9d5ff; }
            .teacher-note .section-title { color: #7c3aed; }
            ul { list-style: none; padding-left: 0; }
            li { margin-bottom: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>PTM Summary for ${studentName}</h1>
          <p class="greeting">${summary.greeting}</p>
          
          <div class="section overall">
            <div class="section-title">📚 Overall Progress</div>
            <div class="section-content">${summary.overallProgress}</div>
          </div>
          
          <div class="grid">
            <div class="section strengths">
              <div class="section-title">✓ What's Going Well</div>
              <ul>
                ${summary.strengths.map(s => `<li>✓ ${s}</li>`).join('')}
              </ul>
            </div>
            
            <div class="section improvements">
              <div class="section-title">📈 Areas for Growth</div>
              <ul>
                ${summary.areasToImprove.map(a => `<li>• ${a}</li>`).join('')}
              </ul>
            </div>
          </div>
          
          <div class="section home-support">
            <div class="section-title">🏠 How You Can Help at Home</div>
            <ul>
              ${summary.homeSupport.map((tip, i) => `<li>${i + 1}. ${tip}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section teacher-note">
            <div class="section-title">💝 A Note from the Teacher</div>
            <div class="section-content"><em>${summary.teacherNote}</em></div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PTM Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary && onGenerate) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PTM Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              Generate a parent-friendly summary for PTM
            </p>
            <Button onClick={onGenerate} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate PTM Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card className="print:shadow-none print:border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PTM Summary for {studentName}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="print:hidden gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Greeting */}
        <p className="text-sm font-medium">{summary.greeting}</p>
        
        {/* Overall Progress */}
        <div className="p-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2 font-medium text-sm mb-1">
            <GraduationCap className="h-4 w-4" />
            Overall Progress
          </div>
          <p className="text-sm text-muted-foreground">{summary.overallProgress}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm mb-2">
              <GraduationCap className="h-4 w-4" />
              What's Going Well
            </div>
            <ul className="space-y-1">
              {summary.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-emerald-800 dark:text-emerald-300">
                  ✓ {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm mb-2">
              <GraduationCap className="h-4 w-4" />
              Areas for Growth
            </div>
            <ul className="space-y-1">
              {summary.areasToImprove.map((area, idx) => (
                <li key={idx} className="text-sm text-amber-800 dark:text-amber-300">
                  • {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Home Support */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium text-sm mb-2">
            <Home className="h-4 w-4" />
            How You Can Help at Home
          </div>
          <ul className="space-y-1">
            {summary.homeSupport.map((tip, idx) => (
              <li key={idx} className="text-sm text-blue-800 dark:text-blue-300">
                {idx + 1}. {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Teacher's Note */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <Heart className="h-4 w-4" />
            A Note from the Teacher
          </div>
          <p className="text-sm italic">{summary.teacherNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}
