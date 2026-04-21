import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface OcrComparisonPanelProps {
  expectedAmount: number;
  enteredAmount: number | null;
  enteredUtr: string | null;
  ocrAmount: number | null;
  ocrUtr: string | null;
  ocrDate: string | null;
  ocrStatus: 'pending' | 'success' | 'failed' | null;
  ocrConfidence: 'high' | 'medium' | 'low' | null;
}

function matchIndicator(...vals: (string | number | null | undefined)[]): '🟢' | '🟡' | '🔴' {
  const present = vals.filter((v) => v !== null && v !== undefined && v !== '');
  if (present.length < 2) return '🟡';
  const norm = present.map((v) => String(v).toLowerCase().trim());
  const allSame = norm.every((v) => v === norm[0]);
  if (allSame) return '🟢';
  // numeric tolerance for amounts
  const nums = present.map((v) => Number(v)).filter((n) => !isNaN(n));
  if (nums.length === present.length) {
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (max - min < 0.01) return '🟢';
  }
  return '🔴';
}

export function OcrComparisonPanel(props: OcrComparisonPanelProps) {
  const {
    expectedAmount,
    enteredAmount,
    enteredUtr,
    ocrAmount,
    ocrUtr,
    ocrDate,
    ocrStatus,
    ocrConfidence,
  } = props;

  const ocrUnavailable = ocrStatus !== 'success';

  const amountMatch = ocrUnavailable
    ? '🟡'
    : matchIndicator(expectedAmount, enteredAmount, ocrAmount);
  const utrMatch = ocrUnavailable
    ? '🟡'
    : matchIndicator(enteredUtr, ocrUtr);
  const dateMatch = ocrUnavailable ? '🟡' : ocrDate ? '🟢' : '🟡';

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">OCR Comparison</span>
        </div>
        {ocrConfidence && !ocrUnavailable && (
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide"
          >
            Confidence: {ocrConfidence}
          </Badge>
        )}
      </div>

      {ocrUnavailable && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-800/60 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-amber-700 dark:text-amber-300">
            OCR unavailable — manual verification required
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/20">
            <tr className="text-muted-foreground">
              <th className="text-left font-medium px-3 py-2"></th>
              <th className="text-left font-medium px-2 py-2">Expected</th>
              <th className="text-left font-medium px-2 py-2">Parent Entered</th>
              <th className="text-left font-medium px-2 py-2">OCR Detected</th>
              <th className="text-center font-medium px-2 py-2">Match</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Amount</td>
              <td className="px-2 py-2">{formatCurrency(expectedAmount)}</td>
              <td className="px-2 py-2">
                {enteredAmount != null ? formatCurrency(enteredAmount) : '—'}
              </td>
              <td className="px-2 py-2">
                {ocrAmount != null ? formatCurrency(ocrAmount) : '—'}
              </td>
              <td className="px-2 py-2 text-center text-base">{amountMatch}</td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">UTR / Txn ID</td>
              <td className="px-2 py-2 text-muted-foreground">—</td>
              <td className="px-2 py-2 font-mono text-[11px] break-all">
                {enteredUtr || '—'}
              </td>
              <td className="px-2 py-2 font-mono text-[11px] break-all">
                {ocrUtr || '—'}
              </td>
              <td className="px-2 py-2 text-center text-base">{utrMatch}</td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Date</td>
              <td className="px-2 py-2 text-muted-foreground">—</td>
              <td className="px-2 py-2 text-muted-foreground">—</td>
              <td className="px-2 py-2">
                {ocrDate ? formatDate(ocrDate) : '—'}
              </td>
              <td className="px-2 py-2 text-center text-base">{dateMatch}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
