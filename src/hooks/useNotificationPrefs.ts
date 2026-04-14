import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsNotificationEnabled(key: string) {
  return useQuery({
    queryKey: ["notification-pref", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("is_enabled")
        .eq("key", key)
        .eq("category", "notifications")
        .maybeSingle();
      if (error) throw error;
      // Default to enabled if flag doesn't exist
      return data?.is_enabled ?? true;
    },
    staleTime: 60_000,
  });
}
