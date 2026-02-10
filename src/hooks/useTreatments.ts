import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Treatment,
  TreatmentWithRelations,
  TreatmentVitals,
  TreatmentMedication,
  TreatmentAssessment,
  KetamineMonitoring,
  TreatmentStatus,
  VitalsPhase,
  MedicationRoute,
  AssessmentType,
} from "@/types/treatment";

// ─── Treatment CRUD ───

export function useTodaysTreatments() {
  return useQuery({
    queryKey: ["treatments", "today"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients!inner(id, first_name, last_name, date_of_birth, phone),
          appointment_type:appointment_types!inner(id, name, color, default_duration_minutes),
          chair:treatment_chairs(id, name)
        `)
        .gte("scheduled_start", todayStart.toISOString())
        .lte("scheduled_start", todayEnd.toISOString())
        .order("scheduled_start", { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useTreatment(id: string | undefined) {
  return useQuery({
    queryKey: ["treatment", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Treatment;
    },
    enabled: !!id,
  });
}

export function useTreatmentByAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment", "appointment", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .eq("appointment_id", appointmentId)
        .maybeSingle();
      if (error) throw error;
      return data as Treatment | null;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      appointment_id: string;
      patient_id: string;
      nurse_id: string;
      treatment_type_id: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("treatments")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Treatment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment"] });
    },
  });
}

export function useUpdateTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Treatment> }) => {
      const { data: result, error } = await supabase
        .from("treatments")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result as Treatment;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment", result.id] });
      queryClient.invalidateQueries({ queryKey: ["treatment", "appointment", result.appointment_id] });
    },
  });
}

// ─── Vitals ───

export function useTreatmentVitals(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-vitals", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      const { data, error } = await supabase
        .from("treatment_vitals")
        .select("*")
        .eq("treatment_id", treatmentId)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data as TreatmentVitals[];
    },
    enabled: !!treatmentId,
  });
}

export function useAddVitals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TreatmentVitals, "id" | "recorded_at">) => {
      const { data, error } = await supabase
        .from("treatment_vitals")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as TreatmentVitals;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-vitals", data.treatment_id] });
    },
  });
}

// ─── Medications ───

export function useTreatmentMedications(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-medications", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      const { data, error } = await supabase
        .from("treatment_medications")
        .select("*")
        .eq("treatment_id", treatmentId)
        .order("administered_at", { ascending: true });
      if (error) throw error;
      return data as TreatmentMedication[];
    },
    enabled: !!treatmentId,
  });
}

export function useAddMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TreatmentMedication, "id">) => {
      const { data, error } = await supabase
        .from("treatment_medications")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as TreatmentMedication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-medications", data.treatment_id] });
    },
  });
}

// ─── Assessments ───

export function useTreatmentAssessments(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-assessments", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      const { data, error } = await supabase
        .from("treatment_assessments")
        .select("*")
        .eq("treatment_id", treatmentId)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data as TreatmentAssessment[];
    },
    enabled: !!treatmentId,
  });
}

export function useAddAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TreatmentAssessment, "id" | "recorded_at">) => {
      const { data, error } = await supabase
        .from("treatment_assessments")
        .insert({
          treatment_id: input.treatment_id,
          assessment_type: input.assessment_type,
          data: input.data as any,
          recorded_by: input.recorded_by,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TreatmentAssessment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-assessments", data.treatment_id] });
    },
  });
}

// ─── Ketamine Monitoring ───

export function useKetamineMonitoring(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["ketamine-monitoring", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      const { data, error } = await supabase
        .from("ketamine_monitoring")
        .select("*")
        .eq("treatment_id", treatmentId)
        .order("minutes_from_start", { ascending: true });
      if (error) throw error;
      return data as KetamineMonitoring[];
    },
    enabled: !!treatmentId,
  });
}

export function useAddKetamineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<KetamineMonitoring, "id" | "recorded_at">) => {
      const { data, error } = await supabase
        .from("ketamine_monitoring")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as KetamineMonitoring;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ketamine-monitoring", data.treatment_id] });
    },
  });
}
