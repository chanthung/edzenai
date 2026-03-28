import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Plus, Save, Trash2, BadgePercent, Info } from "lucide-react";
import { toast } from "sonner";
import {
  useVolumeDiscounts,
  useCreateVolumeDiscount,
  useUpdateVolumeDiscount,
  useDeleteVolumeDiscount,
  type VolumeDiscountTier,
} from "@/hooks/useVolumeDiscounts";

export function VolumeDiscountEditor() {
  const { data: tiers = [], isLoading } = useVolumeDiscounts();
  const createTier = useCreateVolumeDiscount();
  const updateTier = useUpdateVolumeDiscount();
  const deleteTier = useDeleteVolumeDiscount();

  const [editState, setEditState] = useState<Record<string, { min: string; max: string; pct: string }>>({});

  const getEdit = (t: VolumeDiscountTier) =>
    editState[t.id] ?? {
      min: String(t.min_students),
      max: t.max_students != null ? String(t.max_students) : "",
      pct: String(t.discount_percent),
    };

  const setField = (id: string, field: "min" | "max" | "pct", val: string) => {
    setEditState((prev) => {
      const existing = prev[id] ?? getEdit(tiers.find((t) => t.id === id)!);
      return { ...prev, [id]: { ...existing, [field]: val } };
    });
  };

  const handleSave = async (tier: VolumeDiscountTier) => {
    const e = getEdit(tier);
    const min = parseInt(e.min);
    const max = e.max === "" ? null : parseInt(e.max);
    const pct = parseFloat(e.pct);

    if (isNaN(min) || min < 1) return toast.error("Min students must be ≥ 1");
    if (max !== null && (isNaN(max) || max < min)) return toast.error("Max must be ≥ min or empty");
    if (isNaN(pct) || pct < 0 || pct > 100) return toast.error("Discount must be 0–100%");

    try {
      await updateTier.mutateAsync({ id: tier.id, min_students: min, max_students: max, discount_percent: pct });
      setEditState((prev) => { const { [tier.id]: _, ...rest } = prev; return rest; });
      toast.success("Tier updated");
    } catch (err: any) {
      toast.error("Failed to update", { description: err.message });
    }
  };

  const handleAdd = async () => {
    const lastMax = tiers.length ? (tiers[tiers.length - 1].max_students ?? tiers[tiers.length - 1].min_students) : 0;
    try {
      await createTier.mutateAsync({ min_students: lastMax + 1, max_students: null, discount_percent: 0 });
      toast.success("Tier added");
    } catch (err: any) {
      toast.error("Failed to add tier", { description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTier.mutateAsync(id);
      toast.success("Tier removed");
    } catch (err: any) {
      toast.error("Failed to delete", { description: err.message });
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BadgePercent className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Volume Discount Tiers</CardTitle>
              <CardDescription>Automatic discounts based on student count</CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>These discounts apply automatically to monthly billing when a school's student count falls within a tier range. Leave "Max" empty for unlimited.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tiers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No discount tiers configured yet.</p>
        )}

        {tiers.map((tier) => {
          const e = getEdit(tier);
          const isDirty =
            e.min !== String(tier.min_students) ||
            e.max !== (tier.max_students != null ? String(tier.max_students) : "") ||
            e.pct !== String(tier.discount_percent);

          return (
            <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Min Students</Label>
                <Input type="number" min="1" value={e.min} onChange={(ev) => setField(tier.id, "min", ev.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Students</Label>
                <Input type="number" min="1" placeholder="∞" value={e.max} onChange={(ev) => setField(tier.id, "max", ev.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount %</Label>
                <Input type="number" min="0" max="100" step="0.5" value={e.pct} onChange={(ev) => setField(tier.id, "pct", ev.target.value)} />
              </div>
              <div className="flex gap-1.5">
                <Button size="icon" variant="outline" onClick={() => handleSave(tier)} disabled={!isDirty || updateTier.isPending}>
                  {updateTier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(tier.id)} disabled={deleteTier.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={handleAdd} disabled={createTier.isPending} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>
      </CardContent>
    </Card>
  );
}
