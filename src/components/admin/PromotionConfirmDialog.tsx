import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (consent: Record<string, boolean>, notifyWhatsApp: boolean) => Promise<void> | void;
  promoteCount: number;
  retainCount: number;
  fromYearName: string;
  toYearName: string;
  isPending: boolean;
}

const CONSENTS = [
  { id: "marks_final", label: "All marks and report cards are final and teacher-verified" },
  { id: "parent_notify", label: "Parents will be notified via WhatsApp / school channel (optional)" },
  { id: "audit_log", label: "I understand this action is logged with my name, timestamp and IP" },
  { id: "rte_consent", label: "Hold-back students (Class 1–8) have parental consent on record (RTE Act 2009)" },
  { id: "next_year_ready", label: "The next academic year exists with classes/sections ready" },
];

export function PromotionConfirmDialog({
  open, onOpenChange, onConfirm, promoteCount, retainCount, fromYearName, toYearName, isPending,
}: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  const allChecked = CONSENTS.every((c) => checked[c.id]);

  const handleConfirm = async () => {
    await onConfirm(checked, notifyWhatsApp);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setChecked({}); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Confirm Year-End Promotion
          </DialogTitle>
          <DialogDescription>
            Promoting <strong>{promoteCount}</strong> student(s) from <strong>{fromYearName}</strong> to <strong>{toYearName}</strong>
            {retainCount > 0 && <> · Holding back <strong>{retainCount}</strong></>}.
            This is logged and largely irreversible after 24 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {CONSENTS.map((c) => (
            <label key={c.id} className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={!!checked[c.id]}
                onCheckedChange={(v) => setChecked((p) => ({ ...p, [c.id]: !!v }))}
                className="mt-0.5"
              />
              <span className="text-sm leading-snug">{c.label}</span>
            </label>
          ))}

          <div className="rounded-lg border border-dashed p-3 mt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={notifyWhatsApp}
                onCheckedChange={(v) => setNotifyWhatsApp(!!v)}
                className="mt-0.5"
              />
              <span className="text-sm">
                <strong>Optional:</strong> Send WhatsApp notification to parents (uses school's WhatsApp integration).
              </span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!allChecked || isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Promotion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
