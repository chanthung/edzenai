import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { sortClassNames } from "@/lib/class-sort";

export interface SubjectGroup { subjectName: string; classes: string[] }

const short = (c: string) => c.replace(/^Class\s+/i, "");

export function groupAssignments(
  rows: { subject_id: string; class_name: string }[],
  subjectName: (id: string) => string,
  subjectOrder: (id: string) => number,
): SubjectGroup[] {
  const m = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!m.has(r.subject_id)) m.set(r.subject_id, new Set());
    m.get(r.subject_id)!.add(r.class_name);
  }
  return [...m.entries()]
    .sort((a, b) => subjectOrder(a[0]) - subjectOrder(b[0]))
    .map(([id, cls]) => ({ subjectName: subjectName(id), classes: sortClassNames([...cls]) }));
}

export function TeachingChips({ groups, max = 2 }: { groups: SubjectGroup[]; max?: number }) {
  if (groups.length === 0) {
    return <Badge variant="outline" className="border-amber-500/60 bg-amber-500/10 text-amber-700 font-normal">Not assigned</Badge>;
  }
  const label = (g: SubjectGroup) => `${g.subjectName} · ${g.classes.map(short).join(", ")}`;
  const rest = groups.length - max;
  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[260px]">
      {groups.slice(0, max).map(g => (
        <Badge key={g.subjectName} variant="secondary" className="font-normal whitespace-nowrap">{label(g)}</Badge>
      ))}
      {rest > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-xs font-medium text-primary hover:underline px-1">+{rest}</button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 space-y-1.5" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-1">All assignments</p>
            {groups.map(g => (
              <div key={g.subjectName} className="text-sm">
                <span className="font-medium">{g.subjectName}</span>
                <span className="text-muted-foreground"> · {g.classes.map(short).join(", ")}</span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
