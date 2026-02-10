import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NurseStaffMember {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

export function useNurseStaff() {
  return useQuery({
    queryKey: ["nurse-staff"],
    queryFn: async () => {
      // Get all user_ids with nurse role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "nurse");

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const nurseIds = roles.map((r) => r.user_id);

      // Get their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", nurseIds);

      if (profilesError) throw profilesError;
      return (profiles || []) as NurseStaffMember[];
    },
  });
}
