import { useEffect, useMemo, useState } from "react";
import { useSchool } from "@/hooks/useSchool";
import { usePromotionRules, useUpsertPromotionRule } from "@/hooks/usePromotionRules";
import {
  BOARD_DEFAULTS,
  CLASS_RANGES,
  type Board,
  type ClassRange,
  type PromotionRule,
} from "@/lib/promotion-rules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, Save, Plus, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export function PromotionRulesEditor() {
  const { data: school } = useSchool();
  const { data: savedRules, isLoading } = usePromotionRules(school?.id);
  const upsert = useUpsertPromotionRule(school?.id);

  const [board, setBoard] = useState<Board>("CBSE");
  const [activeRange, setActiveRange] = useState<ClassRange>("1-8");
  const [editing, setEditing] = useState<Record<string, PromotionRule>>({});

  // Pick effective rule for current board+range (saved or default)
  const effective = useMemo<PromotionRule>(() => {
    const key = `${board}:${activeRange}`;
    if (editing[key]) return editing[key];
    const saved = savedRules?.find((r) => r.board === board && r.class_range === activeRange);
    return saved ?? BOARD_DEFAULTS[board][activeRange];
  }, [board, activeRange, savedRules, editing]);

  useEffect(() => {
    // pre-load board on mount from school if you ever store it; fall back to CBSE
    setEditing({});
  }, [board]);

  const update = (patch: Partial<PromotionRule>) => {
    const key = `${board}:${activeRange}`;
    setEditing((prev) => ({ ...prev, [key]: { ...effective, ...patch, board, class_range: activeRange } }));
  };

  const restoreDefaults = () => {
    update({ ...BOARD_DEFAULTS[board][activeRange] });
    toast.info("Restored board defaults — remember to save");
  };

  const save = async () => {
    try {
      await upsert.mutateAsync(effective);
      toast.success(`${board} · Class ${activeRange} rules saved`);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[`${board}:${activeRange}`];
        return next;
      });
    } catch (e: any) {
      toast.error("Failed to save", { description: e.message });
    }
  };

  const isDirty = !!editing[`${board}:${activeRange}`];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Promotion Rules
          </CardTitle>
          <CardDescription>
            Configure pass criteria, grace marks, and board-specific rules. Used by the year-end Smart Promotion Engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 max-w-md">
            <div className="space-y-2">
              <Label>Board</Label>
              <Select value={board} onValueChange={(v) => setBoard(v as Board)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE / ISC</SelectItem>
                  <SelectItem value="State">State Board</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeRange} onValueChange={(v) => setActiveRange(v as ClassRange)}>
            <TabsList className="flex-wrap h-auto">
              {CLASS_RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value} className="text-xs sm:text-sm">
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {CLASS_RANGES.map((r) => (
              <TabsContent key={r.value} value={r.value} className="mt-4 space-y-6">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading rules…</p>
                ) : (
                  <RuleForm rule={effective} onChange={update} />
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {isDirty && <Badge variant="secondary">Unsaved changes</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={restoreDefaults}>
                      <RotateCcw className="h-4 w-4 mr-1.5" /> Restore board defaults
                    </Button>
                    <Button size="sm" onClick={save} disabled={!isDirty || upsert.isPending}>
                      {upsert.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                      Save rules
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleForm({ rule, onChange }: { rule: PromotionRule; onChange: (p: Partial<PromotionRule>) => void }) {
  const num = (v: string): number | null => (v === "" ? null : Number(v));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Min % per subject" value={rule.min_subject_pct} onChange={(v) => onChange({ min_subject_pct: Number(v) || 0 })} />
        <Field label="Min % theory (optional)" value={rule.min_theory_pct ?? ""} onChange={(v) => onChange({ min_theory_pct: num(v) })} />
        <Field label="Min % practical (optional)" value={rule.min_practical_pct ?? ""} onChange={(v) => onChange({ min_practical_pct: num(v) })} />
        <Field label="Min % internal (optional)" value={rule.min_internal_pct ?? ""} onChange={(v) => onChange({ min_internal_pct: num(v) })} />
        <Field label="Grace marks allowed" value={rule.grace_marks} onChange={(v) => onChange({ grace_marks: Number(v) || 0 })} />
        <Field label="Max compartment subjects" value={rule.max_compartment_subjects} onChange={(v) => onChange({ max_compartment_subjects: Number(v) || 0 })} />
        <Field label="Best-of-N (ICSE, optional)" value={rule.best_of_n ?? ""} onChange={(v) => onChange({ best_of_n: num(v) })} />
        <Field label="Min attendance % (optional)" value={rule.attendance_threshold ?? ""} onChange={(v) => onChange({ attendance_threshold: num(v) })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SwitchRow
          label="English is compulsory pass"
          checked={rule.english_compulsory}
          onChange={(c) => onChange({ english_compulsory: c })}
        />
        <SwitchRow
          label="Board-exit year (disables promotion)"
          description="e.g., Class 12 — students don't get promoted in EdZen"
          checked={rule.is_board_exit}
          onChange={(c) => onChange({ is_board_exit: c })}
        />
      </div>

      <CustomRules rule={rule} onChange={onChange} />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number | string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={value as any} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SwitchRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (c: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CustomRules({ rule, onChange }: { rule: PromotionRule; onChange: (p: Partial<PromotionRule>) => void }) {
  const add = () => onChange({ custom_rules: [...rule.custom_rules, { subject: "", min_pct: 40 }] });
  const update = (i: number, patch: Partial<{ subject: string; min_pct: number }>) =>
    onChange({ custom_rules: rule.custom_rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  const remove = (i: number) =>
    onChange({ custom_rules: rule.custom_rules.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Custom per-subject rules</Label>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1.5" /> Add rule
        </Button>
      </div>
      {rule.custom_rules.length === 0 ? (
        <p className="text-xs text-muted-foreground">No custom rules. The default min % per subject applies to every subject.</p>
      ) : (
        <div className="space-y-2">
          {rule.custom_rules.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input placeholder="Subject (e.g., Mathematics)" value={r.subject} onChange={(e) => update(i, { subject: e.target.value })} />
              <Input type="number" className="w-28" value={r.min_pct} onChange={(e) => update(i, { min_pct: Number(e.target.value) || 0 })} />
              <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
