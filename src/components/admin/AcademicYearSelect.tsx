import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import type { AcademicYear } from "@/hooks/useAcademicYears";

/** Academic year selector for student forms. Only the school's own years are listed. */
export function AcademicYearSelect({
  years,
  value,
  onChange,
  currentId,
  label = "Academic Year *",
}: {
  years: AcademicYear[] | undefined;
  value: string;
  onChange: (id: string) => void;
  currentId?: string | null;
  label?: string;
}) {
  const list = years ?? [];
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {list.length === 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>No academic years exist. Create one in Academic Years first.</span>
        </div>
      ) : (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select academic year" />
          </SelectTrigger>
          <SelectContent>
            {list.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.name}
                {y.id === currentId ? " (Current)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
