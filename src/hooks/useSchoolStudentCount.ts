import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";

/**
 * Single source of truth for the school's student count used in
 * subscription/billing UI (Pricing page, SubscriptionInfoCard, etc.).
 *
 * Counts ALL rows in `students` for the current admin's school — same query
 * shape used historically by SubscriptionInfoCard, so the two screens never
 * disagree.
 */
export function useSchoolStudentCount() {
  const { data: school } = useSchool();

  const query = useQuery({
    queryKey: ["school-student-count", school?.id],
    queryFn: async () => {
      if (!school?.id) return 0;
      const { count, error } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", school.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!school?.id,
  });

  return {
    count: query.data ?? 0,
    isLoading: query.isLoading,
    schoolId: school?.id,
  };
}
