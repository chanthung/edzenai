import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PromotionRule } from "@/lib/promotion-rules";

export function usePromotionRules(schoolId: string | undefined) {
  return useQuery({
    queryKey: ["promotion-rules", schoolId],
    queryFn: async () => {
      if (!schoolId) return [] as PromotionRule[];
      const { data, error } = await supabase
        .from("promotion_rules" as any)
        .select("*")
        .eq("school_id", schoolId);
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        ...r,
        custom_rules: Array.isArray(r.custom_rules) ? r.custom_rules : [],
      })) as PromotionRule[];
    },
    enabled: !!schoolId,
  });
}

export function useUpsertPromotionRule(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: PromotionRule) => {
      if (!schoolId) throw new Error("Missing school");
      const payload = {
        school_id: schoolId,
        board: rule.board,
        class_range: rule.class_range,
        min_subject_pct: rule.min_subject_pct,
        min_theory_pct: rule.min_theory_pct,
        min_practical_pct: rule.min_practical_pct,
        min_internal_pct: rule.min_internal_pct,
        english_compulsory: rule.english_compulsory,
        grace_marks: rule.grace_marks,
        max_compartment_subjects: rule.max_compartment_subjects,
        best_of_n: rule.best_of_n,
        is_board_exit: rule.is_board_exit,
        attendance_threshold: rule.attendance_threshold,
        custom_rules: rule.custom_rules ?? [],
      };
      const { error } = await supabase
        .from("promotion_rules" as any)
        .upsert(payload, { onConflict: "school_id,board,class_range" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotion-rules", schoolId] }),
  });
}

export function useDeletePromotionRule(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotion_rules" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotion-rules", schoolId] }),
  });
}

export function usePromotionRuns(schoolId: string | undefined) {
  return useQuery({
    queryKey: ["promotion-runs", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("promotion_runs" as any)
        .select("*")
        .eq("school_id", schoolId)
        .order("initiated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!schoolId,
  });
}

export function usePromotionOutcomes(runId: string | undefined) {
  return useQuery({
    queryKey: ["promotion-outcomes", runId],
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from("promotion_outcomes" as any)
        .select("*, students(name, roll_number)")
        .eq("run_id", runId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!runId,
  });
}
