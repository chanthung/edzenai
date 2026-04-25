import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_TEMPLATES, PLACEHOLDERS, REMINDER_LABELS, renderPreview, type ReminderKey } from "@/lib/fee-reminder-defaults";
import { RotateCcw } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminderKey: ReminderKey | null;
  initialValue: string | undefined;
  onSave: (value: string | null) => void;
}

export function TemplateEditorDialog({ open, onOpenChange, reminderKey, initialValue, onSave }: Props) {
  const [value, setValue] = useState("");

  const isCustom = !!initialValue;
  const effective = value || DEFAULT_TEMPLATES[reminderKey || 'on'];

  // Seed textarea with custom value or default whenever the dialog opens for a key
  useEffect(() => {
    if (open && reminderKey) {
      setValue(initialValue ?? DEFAULT_TEMPLATES[reminderKey]);
    }
  }, [open, reminderKey, initialValue]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  if (!reminderKey) return null;

  const insertPlaceholder = (p: string) => {
    setValue((v) => v + p);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit message: {REMINDER_LABELS[reminderKey]}</DialogTitle>
          <DialogDescription>
            Customize the WhatsApp text. Use placeholders to insert dynamic values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map((p) => (
              <Badge
                key={p}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => insertPlaceholder(p)}
              >
                {p}
              </Badge>
            ))}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Message template</Label>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={8}
              className="font-mono text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Live preview</Label>
            <div className="mt-1 rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {renderPreview(effective)}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isCustom && (
            <Button
              variant="ghost"
              onClick={() => {
                onSave(null);
                onOpenChange(false);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to default
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const trimmed = value.trim();
              if (!trimmed || trimmed === DEFAULT_TEMPLATES[reminderKey]) {
                onSave(null);
              } else {
                onSave(trimmed);
              }
              onOpenChange(false);
            }}
          >
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
