import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Pencil, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { useReminderSettings, useSaveReminderSettings, type ReminderSettings } from "@/hooks/useReminderSettings";
import { REMINDER_ORDER, REMINDER_LABELS, DEFAULT_TEMPLATES, type ReminderKey } from "@/lib/fee-reminder-defaults";
import { TemplateEditorDialog } from "./TemplateEditorDialog";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  schoolId: string | undefined;
}

export function ReminderSettingsCard({ schoolId }: Props) {
  const { data, isLoading } = useReminderSettings(schoolId);
  const save = useSaveReminderSettings();
  const [draft, setDraft] = useState<ReminderSettings | null>(null);
  const [editingKey, setEditingKey] = useState<ReminderKey | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  if (isLoading || !draft) {
    return (
      <Card className="mb-6">
        <CardContent className="py-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading reminder settings…
        </CardContent>
      </Card>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);

  const handleSave = async () => {
    try {
      await save.mutateAsync(draft);
      toast.success("Reminder settings saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    if (!schoolId) return;
    setTesting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("send-test-fee-reminder", {
        body: {
          school_id: schoolId,
          phone: testPhone.trim(),
          template: draft.templates.on || DEFAULT_TEMPLATES.on,
          reminder_type: "on",
        },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      toast.success("Test WhatsApp sent");
    } catch (e: any) {
      toast.error(e.message || "Test send failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              WhatsApp Fee Reminders
            </CardTitle>
            <CardDescription>
              Schedule and customize automatic payment reminders sent to parents.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="reminders-enabled" className="text-sm">
              {draft.enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="reminders-enabled"
              checked={draft.enabled}
              onCheckedChange={(v) => setDraft({ ...draft, enabled: v })}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Send time */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Send daily at:
          </div>
          <Select
            value={String(draft.send_hour_ist)}
            onValueChange={(v) => setDraft({ ...draft, send_hour_ist: Number(v) })}
            disabled={!draft.enabled}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">IST</Badge>
        </div>

        {/* Reminder offsets */}
        <div>
          <div className="text-sm font-medium mb-2">Reminders to send</div>
          <div className="space-y-2">
            {REMINDER_ORDER.map((key) => {
              const isOn = draft.offsets_enabled[key] !== false;
              const isCustom = !!draft.templates[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Switch
                      checked={isOn}
                      disabled={!draft.enabled}
                      onCheckedChange={(v) =>
                        setDraft({
                          ...draft,
                          offsets_enabled: { ...draft.offsets_enabled, [key]: v },
                        })
                      }
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{REMINDER_LABELS[key]}</div>
                      <div className="text-xs text-muted-foreground">
                        {isCustom ? "Custom message" : "Default message"}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!draft.enabled || !isOn}
                    onClick={() => setEditingKey(key)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit message
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test send */}
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <div className="text-sm font-medium">Send a test reminder</div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="WhatsApp number (e.g. 9876543210)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleTest} disabled={testing} variant="secondary">
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send test
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Uses the "On due date" template with sample data.
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!dirty || save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardContent>

      <TemplateEditorDialog
        open={editingKey !== null}
        onOpenChange={(o) => !o && setEditingKey(null)}
        reminderKey={editingKey}
        initialValue={editingKey ? draft.templates[editingKey] : undefined}
        onSave={(value) => {
          if (!editingKey) return;
          const nextTemplates = { ...draft.templates };
          if (value === null) {
            delete nextTemplates[editingKey];
          } else {
            nextTemplates[editingKey] = value;
          }
          setDraft({ ...draft, templates: nextTemplates });
        }}
      />
    </Card>
  );
}
