import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReferrals(doctorId?: string) {
  return useQuery({
    queryKey: ["referrals", doctorId],
    queryFn: async () => {
      let query = supabase
        .from("referrals")
        .select("*, doctors(practice_name, email, specialisation)")
        .order("created_at", { ascending: false });

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
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

export function useUpdateReferralStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      patient_id,
      reviewed_by,
      notes,
    }: {
      id: string;
      status: string;
      patient_id?: string;
      reviewed_by?: string;
      notes?: string;
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
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
      // Create the patient
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

      // Link patient to referral
      const { error: linkError } = await supabase
        .from("referrals")
        .update({ patient_id: patient.id })
        .eq("id", referralId);
      if (linkError) throw linkError;

      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
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
