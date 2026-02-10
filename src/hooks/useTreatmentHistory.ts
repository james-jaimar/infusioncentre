import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreatmentHistoryItem {
  id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  appointment_type_name: string;
  appointment_type_color: string;
  medications_count: number;
  vitals_count: number;
}

export function useTreatmentHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-history", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      // Get completed treatments for this patient
      const { data: treatments, error } = await supabase
        .from("treatments")
        .select(`
          id, status, started_at, ended_at, notes, created_at,
          appointment_type:appointment_types!treatments_treatment_type_id_fkey(name, color)
        `)
        .eq("patient_id", patientId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!treatments?.length) return [];

      const treatmentIds = treatments.map((t) => t.id);

      // Batch fetch medication and vitals counts
      const [{ data: meds }, { data: vitals }] = await Promise.all([
        supabase
          .from("treatment_medications")
          .select("treatment_id")
          .in("treatment_id", treatmentIds),
        supabase
          .from("treatment_vitals")
          .select("treatment_id")
          .in("treatment_id", treatmentIds),
      ]);

      const medCounts = new Map<string, number>();
      meds?.forEach((m) => {
        medCounts.set(m.treatment_id, (medCounts.get(m.treatment_id) || 0) + 1);
      });

      const vitalCounts = new Map<string, number>();
      vitals?.forEach((v) => {
        vitalCounts.set(v.treatment_id, (vitalCounts.get(v.treatment_id) || 0) + 1);
      });

      return treatments.map((t): TreatmentHistoryItem => {
        const aptType = t.appointment_type as any;
        return {
          id: t.id,
          status: t.status,
          started_at: t.started_at,
          ended_at: t.ended_at,
          notes: t.notes,
          created_at: t.created_at,
          appointment_type_name: aptType?.name || "Unknown",
          appointment_type_color: aptType?.color || "#3E5B84",
          medications_count: medCounts.get(t.id) || 0,
          vitals_count: vitalCounts.get(t.id) || 0,
        };
      });
    },
    enabled: !!patientId,
  });
}
