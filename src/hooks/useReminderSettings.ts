import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReminderKey } from "@/lib/fee-reminder-defaults";

export type ReminderSettings = {
  school_id: string;
  enabled: boolean;
  send_hour_ist: number;
  offsets_enabled: Record<ReminderKey, boolean>;
  templates: Partial<Record<ReminderKey, string>>;
};

const DEFAULT_OFFSETS: Record<ReminderKey, boolean> = {
  before_7d: true, before_3d: true, on: true, after_1d: true, after_7d: true,
};

export function useReminderSettings(schoolId: string | undefined) {
  return useQuery({
    queryKey: ["reminder-settings", schoolId],
    enabled: !!schoolId,
    queryFn: async (): Promise<ReminderSettings> => {
      const { data, error } = await supabase
        .from("school_reminder_settings" as any)
        .select("*")
        .eq("school_id", schoolId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return {
          school_id: schoolId!,
          enabled: true,
          send_hour_ist: 8,
          offsets_enabled: DEFAULT_OFFSETS,
          templates: {},
        };
      }
      const row = data as any;
      return {
        school_id: row.school_id,
        enabled: row.enabled,
        send_hour_ist: row.send_hour_ist,
        offsets_enabled: { ...DEFAULT_OFFSETS, ...(row.offsets_enabled || {}) },
        templates: row.templates || {},
      };
    },
  });
}

export function useSaveReminderSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: ReminderSettings) => {
      const { error } = await supabase
        .from("school_reminder_settings" as any)
        .upsert({
          school_id: settings.school_id,
          enabled: settings.enabled,
          send_hour_ist: settings.send_hour_ist,
          offsets_enabled: settings.offsets_enabled,
          templates: settings.templates,
        }, { onConflict: "school_id" });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["reminder-settings", vars.school_id] });
    },
  });
}
