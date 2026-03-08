import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TreatmentCourseStatus } from "@/types/treatment";

const QUERY_KEY = "treatment-courses";

export function useTreatmentCourses(statusFilter?: TreatmentCourseStatus[]) {
  return useQuery({
    queryKey: [QUERY_KEY, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("treatment_courses" as any)
        .select(`
          *,
          patient:patients!treatment_courses_patient_id_fkey(id, first_name, last_name),
          appointment_type:appointment_types!treatment_courses_treatment_type_id_fkey(id, name, color),
          doctor:doctors!treatment_courses_doctor_id_fkey(id, practice_name),
          referral:referrals!treatment_courses_referral_id_fkey(id, diagnosis, urgency)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter?.length) {
        query = query.in("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useTreatmentCourse(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_courses" as any)
        .select(`
          *,
          patient:patients!treatment_courses_patient_id_fkey(id, first_name, last_name),
          appointment_type:appointment_types!treatment_courses_treatment_type_id_fkey(id, name, color),
          doctor:doctors!treatment_courses_doctor_id_fkey(id, practice_name),
          referral:referrals!treatment_courses_referral_id_fkey(id, diagnosis, urgency)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useCreateTreatmentCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      referral_id?: string;
      patient_id: string;
      doctor_id?: string;
      treatment_type_id: string;
      total_sessions_planned: number;
      expected_end_date?: string;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("treatment_courses" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateTreatmentCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { error } = await supabase
        .from("treatment_courses" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useConvertReferralToCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      referral_id: string;
      patient_id: string;
      doctor_id: string;
      treatment_type_id: string;
      total_sessions_planned: number;
      expected_end_date?: string;
      notes?: string;
    }) => {
      // Create the treatment course
      const { data: course, error: courseError } = await supabase
        .from("treatment_courses" as any)
        .insert({
          referral_id: data.referral_id,
          patient_id: data.patient_id,
          doctor_id: data.doctor_id,
          treatment_type_id: data.treatment_type_id,
          total_sessions_planned: data.total_sessions_planned,
          expected_end_date: data.expected_end_date,
          notes: data.notes,
          status: "draft",
        } as any)
        .select()
        .single();
      if (courseError) throw courseError;

      // Update referral status to accepted
      const { error: refError } = await supabase
        .from("referrals")
        .update({ status: "accepted" } as any)
        .eq("id", data.referral_id);
      if (refError) throw refError;

      return course;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}
