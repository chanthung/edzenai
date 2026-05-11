import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BlockedSchoolInfo {
  school_id: string;
  school_name: string;
  reason: string | null;
  blocked_at: string | null;
}

/**
 * Returns the user's school if it has been admin-blocked (suspicious activity lockout).
 * Returns null if the user's school is not blocked.
 */
export function useAccessBlock() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["access-block", user?.id],
    queryFn: async (): Promise<BlockedSchoolInfo | null> => {
      const { data, error } = await (supabase as any).rpc("current_user_blocked_school");
      if (error) {
        console.error("[useAccessBlock] error", error);
        return null;
      }
      const row = Array.isArray(data) ? data[0] : data;
      return row || null;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return { blocked: data || null, isLoading };
}
