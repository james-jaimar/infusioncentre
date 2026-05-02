import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReferrals(doctorId?: string) {
  return useQuery({
    queryKey: ["referrals", doctorId],
    queryFn: async () => {
      let query = supabase
        .from("referrals")
        .select("*, doctors(id, user_id, practice_name, email, specialisation), treatment_courses:treatment_courses!treatment_courses_referral_id_fkey(id, total_sessions_planned, appointments:appointments!appointments_treatment_course_id_fkey(id, status))")
        .order("created_at", { ascending: false });

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = Array.from(
        new Set(
          (data || [])
            .map((r: any) => r.doctors?.user_id)
            .filter(Boolean)
        )
      );

      let profileMap = new Map<string, { first_name: string | null; last_name: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        profileMap = new Map(
          (profiles || []).map((p: any) => [p.user_id, { first_name: p.first_name, last_name: p.last_name }])
        );
      }

      return (data || []).map((r: any) => {
        const userId = r.doctors?.user_id;
        const profile = userId ? profileMap.get(userId) : null;
        const fallbackName = profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "";
        const displayName =
          r.doctors?.practice_name ||
          fallbackName ||
          r.doctors?.email ||
          "Unknown Doctor";
        const courses = Array.isArray(r.treatment_courses) ? r.treatment_courses : [];
        const totalSessionsPlanned = courses.reduce(
          (sum: number, c: any) => sum + (c.total_sessions_planned || 0),
          0
        );
        const appointmentCount = courses.reduce(
          (sum: number, c: any) =>
            sum +
            (Array.isArray(c.appointments)
              ? c.appointments.filter((a: any) => a.status !== "cancelled").length
              : 0),
          0
        );
        return {
          ...r,
          doctor_display_name: displayName,
          doctor_profile: profile || null,
          course_count: courses.length,
          appointment_count: appointmentCount,
          total_sessions_planned: totalSessionsPlanned,
        };
      });
    },
  });
}

export function useReferral(id?: string) {
  return useQuery({
    queryKey: ["referral", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*, doctors(id, user_id, practice_name, email, specialisation)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (referral: {
      doctor_id: string;
      patient_first_name: string;
      patient_last_name: string;
      patient_email?: string;
      patient_phone?: string;
      diagnosis?: string;
      treatment_requested?: string;
      prescription_notes?: string;
      urgency: "routine" | "urgent";
      status?: string;
      medical_aid_scheme?: string | null;
      medical_aid_number?: string | null;
      medical_aid_main_member?: string | null;
      icd10_codes?: string[] | null;
      clinical_history?: string | null;
      current_medications?: string | null;
      reason_for_referral?: string | null;
      treatment_type_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("referrals")
        .insert(referral as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

export function useLinkReferralPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ referralId, patientId }: { referralId: string; patientId: string | null }) => {
      const { error } = await supabase
        .from("referrals")
        .update({ patient_id: patientId })
        .eq("id", referralId);
      if (error) throw error;
      return { referralId, patientId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral"] });
    },
  });
}

export function useUpdateReferralStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      patient_id,
      reviewed_by,
      notes,
      from_status,
    }: {
      id: string;
      status: string;
      patient_id?: string;
      reviewed_by?: string;
      notes?: string;
      from_status?: string;
    }) => {
      const update: Record<string, any> = { status, reviewed_at: new Date().toISOString() };
      if (patient_id !== undefined) update.patient_id = patient_id;
      if (reviewed_by) update.reviewed_by = reviewed_by;
      if (notes !== undefined) update.notes = notes;

      const { error } = await supabase
        .from("referrals")
        .update(update)
        .eq("id", id);
      if (error) throw error;

      // Best-effort audit log
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("audit_log").insert({
            user_id: user.id,
            action: "referral_status_change",
            details: {
              referral_id: id,
              from_status: from_status || null,
              to_status: status,
              notes: notes || null,
            },
          } as any);
        }
      } catch {
        // non-blocking
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral"] });
    },
  });
}

export function useReferralAuditTrail(referralId?: string) {
  return useQuery({
    queryKey: ["referral-audit", referralId],
    enabled: !!referralId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, action, details, created_at, user_id")
        .eq("action", "referral_status_change")
        .filter("details->>referral_id", "eq", referralId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreatePatientFromReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      referralId,
      firstName,
      lastName,
      email,
      phone,
      medicalAidScheme,
      medicalAidNumber,
      medicalAidMainMember,
    }: {
      referralId: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      medicalAidScheme?: string | null;
      medicalAidNumber?: string | null;
      medicalAidMainMember?: string | null;
    }) => {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          medical_aid_name: medicalAidScheme || null,
          medical_aid_number: medicalAidNumber || null,
          medical_aid_main_member: medicalAidMainMember || null,
          status: "active" as any,
        })
        .select()
        .single();
      if (patientError) throw patientError;

      const { error: linkError } = await supabase
        .from("referrals")
        .update({ patient_id: patient.id })
        .eq("id", referralId);
      if (linkError) throw linkError;

      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useSearchPatients() {
  return async (search: string) => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name, email, phone, date_of_birth, status")
      .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(5);
    if (error) throw error;
    return data || [];
  };
}
