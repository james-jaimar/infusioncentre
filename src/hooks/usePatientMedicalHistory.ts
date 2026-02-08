import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PatientMedicalHistory, Medication } from "@/types/patient";
import type { Json } from "@/integrations/supabase/types";

export function usePatientMedicalHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-medical-history', patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const { data, error } = await supabase
        .from('patient_medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      // Parse current_medications from JSON
      const medications = Array.isArray(data.current_medications) 
        ? (data.current_medications as unknown as Medication[])
        : null;
      
      return {
        id: data.id,
        patient_id: data.patient_id,
        allergies: data.allergies,
        chronic_conditions: data.chronic_conditions,
        current_medications: medications,
        previous_surgeries: data.previous_surgeries,
        notes: data.notes,
        updated_at: data.updated_at,
        updated_by: data.updated_by,
      } as PatientMedicalHistory;
    },
    enabled: !!patientId,
  });
}

export function useUpsertPatientMedicalHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (history: Omit<PatientMedicalHistory, 'id' | 'updated_at'> & { id?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const payload = {
        patient_id: history.patient_id,
        allergies: history.allergies,
        chronic_conditions: history.chronic_conditions,
        current_medications: history.current_medications as unknown as Json,
        previous_surgeries: history.previous_surgeries,
        notes: history.notes,
        updated_by: user?.user?.id,
      };

      if (history.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('patient_medical_history')
          .update(payload)
          .eq('id', history.id)
          .select()
          .single();

        if (error) throw error;
        
        return {
          ...data,
          current_medications: Array.isArray(data.current_medications) 
            ? (data.current_medications as unknown as Medication[])
            : null,
        } as PatientMedicalHistory;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('patient_medical_history')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        
        return {
          ...data,
          current_medications: Array.isArray(data.current_medications) 
            ? (data.current_medications as unknown as Medication[])
            : null,
        } as PatientMedicalHistory;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-medical-history', data.patient_id] });
    },
  });
}
