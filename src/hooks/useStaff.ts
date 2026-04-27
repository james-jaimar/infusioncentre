import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StaffMember = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  role: "admin" | "nurse" | "doctor";
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
  is_disabled: boolean;
  must_change_password: boolean;
  created_at: string;
  doctor: {
    practice_name: string | null;
    practice_number: string | null;
    specialisation: string | null;
  } | null;
};

async function invoke<T = any>(fn: string, body: any): Promise<T> {
  const res = await supabase.functions.invoke(fn, { body });
  if (res.error || (res.data as any)?.error) {
    throw new Error((res.data as any)?.error || res.error?.message || "Request failed");
  }
  return res.data as T;
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const data = await invoke<{ staff: StaffMember[] }>("list-staff", {});
      return data.staff;
    },
  });
}

export function useStaffMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["staff-list"] });

  return {
    create: useMutation({
      mutationFn: (body: any) => invoke("create-staff", body),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: (body: any) => invoke("update-staff", body),
      onSuccess: refresh,
    }),
    resetPassword: useMutation({
      mutationFn: (body: any) => invoke("reset-staff-password", body),
    }),
    setStatus: useMutation({
      mutationFn: (body: { user_id: string; disable: boolean }) => invoke("set-staff-status", body),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (user_id: string) => invoke("delete-staff", { user_id }),
      onSuccess: refresh,
    }),
  };
}