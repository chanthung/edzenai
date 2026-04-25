import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSchool } from "@/hooks/useSchool";
import { exportToXLSX } from "@/lib/export-utils";
import { Printer, Download, X, CheckCircle2, UserMinus } from "lucide-react";
import { sortClassNames } from "@/lib/class-sort";

export interface PromotionOutcomeRow {
  student_id: string;
  student_name: string;
  roll_number?: string | null;
  from_class: string | null;
  from_section: string | null;
  to_class: string | null;
  to_section: string | null;
  final_pct: number | null;
  status: "promoted" | "retained" | "compartment" | "excluded";
  failing_subjects: string[];
}

interface Props {
  fromYear: string;
  toYear: string;
  outcomes: PromotionOutcomeRow[];
  onClose: () => void;
}

export function PromotionResultReport({ fromYear, toYear, outcomes, onClose }: Props) {
  const { data: school } = useSchool();
  const ref = useRef<HTMLDivElement>(null);

  const promoted = outcomes.filter((o) => o.status === "promoted");
  const heldBack = outcomes.filter((o) => o.status === "retained" || o.status === "compartment");

  const groupedPromoted = groupByClass(promoted, "to_class");
  const groupedHeld = groupByClass(heldBack, "from_class");

  const exportPromoted = () => {
    if (promoted.length === 0) return;
    exportToXLSX(
      promoted.map((p) => ({
        Student: p.student_name,
        Roll: p.roll_number ?? "",
        "From Class": p.from_class ?? "",
        Section: p.from_section ?? "",
        "Promoted To": p.to_class ?? "",
        "New Section": p.to_section ?? "",
        "Final %": p.final_pct?.toFixed(1) ?? "",
      })),
      { filename: `Promoted_Students_${fromYear}_to_${toYear}`, sheetName: "Promoted" }
    );
  };

  const exportHeld = () => {
    if (heldBack.length === 0) return;
    exportToXLSX(
      heldBack.map((p) => ({
        Student: p.student_name,
        Roll: p.roll_number ?? "",
        Class: p.from_class ?? "",
        Section: p.from_section ?? "",
        "Final %": p.final_pct?.toFixed(1) ?? "",
        Status: p.status,
        "Failing Subjects": p.failing_subjects.join(", "),
      })),
      { filename: `Held_Back_Students_${fromYear}_to_${toYear}`, sheetName: "Held Back" }
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar (hidden in print) */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex gap-2">
          <Badge className="bg-status-paid/15 text-status-paid border-status-paid/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />{promoted.length} promoted
          </Badge>
          {heldBack.length > 0 && (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
              <UserMinus className="h-3 w-3 mr-1" />{heldBack.length} held back
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPromoted} disabled={promoted.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Promoted XLSX
          </Button>
          <Button variant="outline" size="sm" onClick={exportHeld} disabled={heldBack.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Held-back XLSX
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Printable area */}
      <div ref={ref} className="promotion-print-area space-y-6">
        <header className="space-y-1 border-b pb-4">
          <div className="flex items-center gap-3">
            {school?.logo_url && <img src={school.logo_url} alt="" className="h-12 w-12 object-contain" />}
            <div>
              <h1 className="text-2xl font-bold">{school?.name ?? "School"}</h1>
              {school?.address && <p className="text-sm text-muted-foreground">{school.address}</p>}
            </div>
          </div>
          <h2 className="text-lg font-semibold pt-2">Promotion Results · {fromYear} → {toYear}</h2>
          <p className="text-xs text-muted-foreground">Generated {new Date().toLocaleString()}</p>
        </header>

        {/* Promoted */}
        <section>
          <h3 className="text-base font-semibold mb-2">Promoted Students ({promoted.length})</h3>
          {promoted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students promoted in this run.</p>
          ) : (
            sortClassNames(Object.keys(groupedPromoted)).map((cls) => (
              <div key={cls} className="mb-4 break-inside-avoid">
                <h4 className="font-medium text-sm mb-1">{cls} ({groupedPromoted[cls].length})</h4>
                <table className="w-full text-xs border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 border">#</th>
                      <th className="text-left p-2 border">Student</th>
                      <th className="text-left p-2 border">Roll</th>
                      <th className="text-left p-2 border">From</th>
                      <th className="text-left p-2 border">Section</th>
                      <th className="text-right p-2 border">Final %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedPromoted[cls].map((s, i) => (
                      <tr key={s.student_id}>
                        <td className="p-2 border">{i + 1}</td>
                        <td className="p-2 border">{s.student_name}</td>
                        <td className="p-2 border">{s.roll_number ?? "—"}</td>
                        <td className="p-2 border">{s.from_class ?? "—"}</td>
                        <td className="p-2 border">{s.to_section ?? s.from_section ?? "—"}</td>
                        <td className="p-2 border text-right">{s.final_pct?.toFixed(1) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </section>

        {/* Held back */}
        {heldBack.length > 0 && (
          <section>
            <h3 className="text-base font-semibold mb-2">Held Back / Compartment ({heldBack.length})</h3>
            {sortClassNames(Object.keys(groupedHeld)).map((cls) => (
              <div key={cls} className="mb-4 break-inside-avoid">
                <h4 className="font-medium text-sm mb-1">{cls} ({groupedHeld[cls].length})</h4>
                <table className="w-full text-xs border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 border">#</th>
                      <th className="text-left p-2 border">Student</th>
                      <th className="text-left p-2 border">Roll</th>
                      <th className="text-left p-2 border">Status</th>
                      <th className="text-left p-2 border">Failing Subjects</th>
                      <th className="text-right p-2 border">Final %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedHeld[cls].map((s, i) => (
                      <tr key={s.student_id}>
                        <td className="p-2 border">{i + 1}</td>
                        <td className="p-2 border">{s.student_name}</td>
                        <td className="p-2 border">{s.roll_number ?? "—"}</td>
                        <td className="p-2 border capitalize">{s.status}</td>
                        <td className="p-2 border">{s.failing_subjects.join(", ") || "—"}</td>
                        <td className="p-2 border text-right">{s.final_pct?.toFixed(1) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        )}

        <footer className="pt-8 grid grid-cols-2 gap-6 text-sm">
          <div className="border-t pt-2">Principal Signature</div>
          <div className="border-t pt-2">Date</div>
        </footer>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .promotion-print-area, .promotion-print-area * { visibility: visible; }
          .promotion-print-area { position: absolute; inset: 0; padding: 1.5rem; background: white; color: black; }
          .promotion-print-area table { border-color: #999 !important; }
          .promotion-print-area th, .promotion-print-area td { border-color: #999 !important; }
        }
      `}</style>
    </div>
  );
}

function groupByClass<T extends { from_class?: string | null; to_class?: string | null }>(
  rows: T[],
  key: "from_class" | "to_class",
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const r of rows) {
    const k = (r[key] as string) || "Unassigned";
    (out[k] ??= []).push(r);
  }
  return out;
}
