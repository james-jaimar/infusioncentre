import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDoctorProfile() {
  return useQuery({
    queryKey: ["doctor-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useAllDoctors() {
  return useQuery({
    queryKey: ["all-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const doctors = data || [];
      const userIds = doctors.map((d: any) => d.user_id).filter(Boolean);
      if (userIds.length === 0) return doctors;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);
      const byId = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return doctors.map((d: any) => {
        const p = byId.get(d.user_id) as any;
        return {
          ...d,
          first_name: p?.first_name ?? null,
          last_name: p?.last_name ?? null,
          full_name: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : null,
        };
      });
    },
  });
}
