import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function useUnreadMessageCount() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["unread-message-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Realtime refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("unread-messages-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return query.data || 0;
}
