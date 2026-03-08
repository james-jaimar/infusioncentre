import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export interface ChairOccupant {
  treatmentId: string;
  appointmentId: string;
  patientName: string;
  treatmentType: string;
  treatmentTypeColor: string;
  status: string;
  startedAt: string | null;
  lastVitalsAt: string | null;
}

export interface ChairData {
  id: string;
  name: string;
  displayOrder: number;
  status: string;
  occupant: ChairOccupant | null;
}

export interface UnassignedTreatment {
  treatmentId: string;
  appointmentId: string;
  patientName: string;
  treatmentType: string;
  status: string;
  startedAt: string | null;
}

export interface UpcomingSession {
  appointmentId: string;
  patientName: string;
  treatmentType: string;
  scheduledStart: string;
  scheduledEnd: string;
  chairName: string | null;
}

export function useCommandCentre() {
  const queryClient = useQueryClient();
  const today = new Date();

  const chairsQuery = useQuery({
    queryKey: ["command-centre", "chairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_chairs")
        .select("id, name, display_order, status")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const treatmentsQuery = useQuery({
    queryKey: ["command-centre", "treatments", today.toDateString()],
    queryFn: async () => {
      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();

      // Get today's active treatments with appointment, patient, type
      const { data, error } = await supabase
        .from("treatments")
        .select(`
          id,
          appointment_id,
          started_at,
          status,
          patient:patients!inner(first_name, last_name),
          appointment:appointments!inner(
            id, chair_id, scheduled_start
          ),
          treatment_type:appointment_types!inner(name, color)
        `)
        .in("status", ["pre_assessment", "in_progress", "post_assessment"])
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 15000,
  });

  // Get latest vitals for all active treatment IDs
  const activeTreatmentIds = (treatmentsQuery.data || []).map((t: any) => t.id);

  const vitalsQuery = useQuery({
    queryKey: ["command-centre", "vitals", activeTreatmentIds],
    queryFn: async () => {
      if (activeTreatmentIds.length === 0) return {};
      const { data, error } = await supabase
        .from("treatment_vitals")
        .select("treatment_id, recorded_at")
        .in("treatment_id", activeTreatmentIds)
        .order("recorded_at", { ascending: false });
      if (error) throw error;

      // Map to latest per treatment
      const latest: Record<string, string> = {};
      for (const v of data || []) {
        if (!latest[v.treatment_id]) {
          latest[v.treatment_id] = v.recorded_at;
        }
      }
      return latest;
    },
    enabled: activeTreatmentIds.length > 0,
    refetchInterval: 15000,
  });

  // Map chairs to occupants
  const chairs: ChairData[] = (chairsQuery.data || []).map((chair) => {
    const treatment = (treatmentsQuery.data || []).find(
      (t: any) => t.appointment?.chair_id === chair.id
    );
    const occupant: ChairOccupant | null = treatment
      ? {
          treatmentId: treatment.id,
          appointmentId: treatment.appointment_id,
          patientName: `${treatment.patient.first_name} ${treatment.patient.last_name}`,
          treatmentType: treatment.treatment_type.name,
          treatmentTypeColor: treatment.treatment_type.color,
          status: treatment.status,
          startedAt: treatment.started_at,
          lastVitalsAt: (vitalsQuery.data || {})[treatment.id] || null,
        }
      : null;
    return { id: chair.id, name: chair.name, displayOrder: chair.display_order, status: chair.status || "available", occupant };
  });

  // Unassigned treatments (no chair_id on appointment)
  const unassigned: UnassignedTreatment[] = (treatmentsQuery.data || [])
    .filter((t: any) => !t.appointment?.chair_id)
    .map((t: any) => ({
      treatmentId: t.id,
      appointmentId: t.appointment_id,
      patientName: `${t.patient.first_name} ${t.patient.last_name}`,
      treatmentType: t.treatment_type.name,
      status: t.status,
      startedAt: t.started_at,
    }));

  // Upcoming sessions: today's scheduled/confirmed appointments not yet started
  const upcomingQuery = useQuery({
    queryKey: ["command-centre", "upcoming", today.toDateString()],
    queryFn: async () => {
      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          chair_id,
          patient:patients!inner(first_name, last_name),
          appointment_type:appointment_types!inner(name),
          chair:treatment_chairs(name)
        `)
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_start", dayStart)
        .lte("scheduled_start", dayEnd)
        .order("scheduled_start", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000,
  });

  const upcomingSessions: UpcomingSession[] = (upcomingQuery.data || []).map((a: any) => ({
    appointmentId: a.id,
    patientName: `${a.patient.first_name} ${a.patient.last_name}`,
    treatmentType: a.appointment_type.name,
    scheduledStart: a.scheduled_start,
    scheduledEnd: a.scheduled_end,
    chairName: a.chair?.name || null,
  }));

  const assignChair = useMutation({
    mutationFn: async ({ appointmentId, chairId }: { appointmentId: string; chairId: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ chair_id: chairId })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["command-centre"] });
    },
  });

  const isLoading = chairsQuery.isLoading || treatmentsQuery.isLoading;

  return { chairs, unassigned, upcomingSessions, isLoading, assignChair };
}
