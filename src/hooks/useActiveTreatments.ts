import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useActiveTreatments() {
  return useQuery({
    queryKey: ["treatments", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select(`
          id,
          appointment_id,
          started_at,
          status,
          patient:patients!inner(first_name, last_name),
          appointment_type:appointment_types!inner(name, color),
          appointment:appointments!inner(
            chair:treatment_chairs(name)
          )
        `)
        .in("status", ["pre_assessment", "in_progress"])
        .order("started_at", { ascending: true });

      if (error) throw error;

      // Flatten chair from appointment relation
      return (data || []).map((t: any) => ({
        ...t,
        chair: t.appointment?.chair || null,
      }));
    },
    refetchInterval: 15000,
  });
}
