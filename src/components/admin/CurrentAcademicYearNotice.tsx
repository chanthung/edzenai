import { AlertTriangle, CalendarDays } from "lucide-react";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import type { AcademicYear, CurrentAcademicYearResult } from "@/hooks/useAcademicYears";

/** Read-only academic year context shown in student forms. */
export function CurrentAcademicYearNotice({
  result,
  year,
  label = "Academic Year",
}: {
  result: CurrentAcademicYearResult;
  /** Override the displayed year (e.g. an existing enrollment's year). */
  year?: AcademicYear | null;
  label?: string;
}) {
  const shown = year ?? result.year;

  if (shown) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium">{shown.name}</span>
          <span className="text-muted-foreground">
            ({formatDate(shown.start_date)} — {formatDate(shown.end_date)})
          </span>
        </div>
      </div>
    );
  }

  if (result.status === "loading") return null;

  const message =
    result.status === "overlap"
      ? `Overlapping academic years cover today's date (${result.matches
          .map((y) => y.name)
          .join(", ")}). An administrator must fix the dates in Academic Years before students can be added.`
      : "No academic year covers today's date. An administrator must create or correct an academic year in Academic Years before students can be added.";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
