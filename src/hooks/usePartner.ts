import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PartnerStats {
  totalSchools: number;
  activeSchools: number;
  totalEarnings: number;
  pendingPayouts: number;
}

export function useCurrentPartner() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["current-partner", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function usePartnerSchools(partnerId?: string) {
  return useQuery({
    queryKey: ["partner-schools", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, created_at, system_state, subscription_status, payment_verified, trial_end_date")
        .eq("referred_by" as any, partnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePartnerCommissions(partnerId?: string) {
  return useQuery({
    queryKey: ["partner-commissions", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions" as any)
        .select("*")
        .eq("partner_id", partnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function usePartnerPayouts(partnerId?: string) {
  return useQuery({
    queryKey: ["partner-payouts", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_payouts" as any)
        .select("*")
        .eq("partner_id", partnerId!)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}
