import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_STARTER_RATE = 7;
export const DEFAULT_PRO_RATE = 10;

export function getDefaultRate(plan: string) {
  return plan === 'pro' ? DEFAULT_PRO_RATE : DEFAULT_STARTER_RATE;
}

export interface SubscriptionPricing {
  id: string;
  plan: string;
  per_student_fee: number;
  base_monthly_fee: number;
  updated_at: string;
}

export function useSubscriptionPricing() {
  return useQuery({
    queryKey: ['subscription-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_pricing')
        .select('*')
        .order('plan');

      if (error) throw error;
      return (data || []) as SubscriptionPricing[];
    },
  });
}

export function useUpdateSubscriptionPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { plan: string; per_student_fee: number; base_monthly_fee: number }) => {
      const { data, error } = await supabase
        .from('subscription_pricing')
        .update({
          per_student_fee: updates.per_student_fee,
          base_monthly_fee: updates.base_monthly_fee,
          updated_at: new Date().toISOString(),
        })
        .eq('plan', updates.plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-pricing'] });
    },
  });
}

export function calculateMonthlyFee(
  studentCount: number,
  perStudentFee: number,
  baseFee: number,
  discountPercent: number = 0,
  customPerStudentFee?: number | null,
) {
  const effectiveRate = customPerStudentFee ?? perStudentFee;
  const subtotal = (studentCount * effectiveRate) + baseFee;
  const discount = subtotal * (discountPercent / 100);
  return {
    studentCount,
    effectiveRate,
    baseFee,
    subtotal,
    discountPercent,
    discountAmount: discount,
    totalFee: Math.max(0, subtotal - discount),
  };
}
