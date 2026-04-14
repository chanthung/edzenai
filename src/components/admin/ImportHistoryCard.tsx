import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useImportLogs, type ImportLog } from "@/hooks/useImportLogs";
import { generateImportReport, type IssueRow } from "@/lib/import-report";
import { FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from "lucide-react";

export function ImportHistoryCard() {
  const { data: logs, isLoading } = useImportLogs();

  if (isLoading || !logs || logs.length === 0) return null;

  const handleDownload = (log: ImportLog) => {
    const issueRows = (log.issue_rows || []) as IssueRow[];
    const ignoredCols = (log.ignored_columns || []) as string[];
    generateImportReport(issueRows, ignoredCols);
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-4 w-4" />
          Recent Imports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.slice(0, 3).map((log) => {
          const hasIssues = log.failed_count > 0;
          const date = new Date(log.imported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          return (
            <div key={log.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{log.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{date}</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {log.imported_count}
                  </Badge>
                  {hasIssues && (
                    <Badge className="text-xs px-1.5 py-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {log.failed_count}
                    </Badge>
                  )}
                </div>
              </div>
              {hasIssues && (
                <Button variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={() => handleDownload(log)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
