import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VolumeDiscountTier {
  id: string;
  min_students: number;
  max_students: number | null;
  discount_percent: number;
  updated_at: string;
}

export function useVolumeDiscounts() {
  return useQuery({
    queryKey: ['volume-discount-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volume_discount_tiers' as any)
        .select('*')
        .order('min_students');
      if (error) throw error;
      return (data || []) as unknown as VolumeDiscountTier[];
    },
  });
}

export function useCreateVolumeDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tier: { min_students: number; max_students: number | null; discount_percent: number }) => {
      const { data, error } = await supabase
        .from('volume_discount_tiers' as any)
        .insert(tier as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volume-discount-tiers'] }),
  });
}

export function useUpdateVolumeDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; min_students?: number; max_students?: number | null; discount_percent?: number }) => {
      const { data, error } = await supabase
        .from('volume_discount_tiers' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volume-discount-tiers'] }),
  });
}

export function useDeleteVolumeDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('volume_discount_tiers' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volume-discount-tiers'] }),
  });
}

export function getApplicableDiscount(studentCount: number, tiers: VolumeDiscountTier[]): number {
  if (!tiers || tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => b.min_students - a.min_students);
  const match = sorted.find(t =>
    studentCount >= t.min_students && (t.max_students === null || studentCount <= t.max_students)
  );
  return match?.discount_percent ?? 0;
}
