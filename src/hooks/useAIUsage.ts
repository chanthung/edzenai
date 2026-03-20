import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getFeatureLimit, type PlanFeature, type SubscriptionPlan } from '@/config/plan-features';

export function useAIUsage(schoolId: string | undefined, plan: SubscriptionPlan) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current month's usage counts per feature
  const { data: usageCounts = {}, isLoading } = useQuery({
    queryKey: ['ai-usage', schoolId],
    queryFn: async () => {
      if (!schoolId) return {};

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ai_usage_log' as any)
        .select('feature')
        .eq('school_id', schoolId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data as any[])?.forEach((row: any) => {
        counts[row.feature] = (counts[row.feature] || 0) + 1;
      });
      return counts;
    },
    enabled: !!schoolId && !!user,
  });

  const logUsage = useMutation({
    mutationFn: async (feature: string) => {
      if (!schoolId) throw new Error('No school ID');
      const { error } = await supabase
        .from('ai_usage_log' as any)
        .insert({ school_id: schoolId, feature } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage', schoolId] });
    },
  });

  function hasRemainingUsage(feature: PlanFeature): boolean {
    const limit = getFeatureLimit(plan, feature);
    if (limit === null) return true; // unlimited
    const used = (usageCounts as Record<string, number>)[feature] || 0;
    return used < limit;
  }

  function getUsageCount(feature: PlanFeature): number {
    return (usageCounts as Record<string, number>)[feature] || 0;
  }

  function getRemainingCount(feature: PlanFeature): number | null {
    const limit = getFeatureLimit(plan, feature);
    if (limit === null) return null;
    return Math.max(0, limit - getUsageCount(feature));
  }

  return {
    usageCounts,
    isLoading,
    logUsage,
    hasRemainingUsage,
    getUsageCount,
    getRemainingCount,
  };
}
