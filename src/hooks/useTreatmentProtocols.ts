import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TreatmentProtocol,
  TreatmentProtocolStep,
  DischargeCriterion,
  VitalsThresholds,
  ClinicalAlert,
  TreatmentSummary,
  DischargeReadiness,
  VitalsAlert,
} from "@/types/protocol";
import type { TreatmentVitals } from "@/types/treatment";

// ─── Protocols ───

export function useTreatmentProtocol(treatmentTypeId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-protocol", treatmentTypeId],
    queryFn: async () => {
      if (!treatmentTypeId) return null;
      const { data, error } = await supabase
        .from("treatment_protocols")
        .select("*")
        .eq("treatment_type_id", treatmentTypeId)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TreatmentProtocol | null;
    },
    enabled: !!treatmentTypeId,
  });
}

export function useProtocolSteps(protocolId: string | undefined) {
  return useQuery({
    queryKey: ["protocol-steps", protocolId],
    queryFn: async () => {
      if (!protocolId) return [];
      const { data, error } = await supabase
        .from("treatment_protocol_steps")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("step_order", { ascending: true });
      if (error) throw error;
      return data as TreatmentProtocolStep[];
    },
    enabled: !!protocolId,
  });
}

// ─── Discharge Criteria ───

export function useDischargeCriteria(protocolId: string | undefined) {
  return useQuery({
    queryKey: ["discharge-criteria", protocolId],
    queryFn: async () => {
      if (!protocolId) return [];
      const { data, error } = await supabase
        .from("discharge_criteria")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as DischargeCriterion[];
    },
    enabled: !!protocolId,
  });
}

// Evaluate discharge readiness based on criteria and current treatment state
export function evaluateDischargeReadiness(
  criteria: DischargeCriterion[],
  context: {
    latestVitals?: TreatmentVitals | null;
    treatmentStartedAt?: string | null;
    treatmentEndedAt?: string | null;
    infusionEndedAt?: string | null;
    hasActiveReactions?: boolean;
    ivRemoved?: boolean;
    dissociationScore?: number | null;
  }
): DischargeReadiness {
  const results: DischargeReadiness["criteria"] = [];
  const blockers: string[] = [];

  for (const criterion of criteria) {
    let met = false;
    let reason: string | undefined;

    switch (criterion.criterion_key) {
      case "vitals_stable": {
        const v = context.latestVitals;
        const cfg = criterion.rule_config;
        if (!v) {
          reason = "No vitals recorded";
        } else {
          const issues: string[] = [];
          if (cfg.bp_systolic_max && v.blood_pressure_systolic && v.blood_pressure_systolic > cfg.bp_systolic_max) {
            issues.push(`BP systolic ${v.blood_pressure_systolic} > ${cfg.bp_systolic_max}`);
          }
          if (cfg.bp_diastolic_max && v.blood_pressure_diastolic && v.blood_pressure_diastolic > cfg.bp_diastolic_max) {
            issues.push(`BP diastolic ${v.blood_pressure_diastolic} > ${cfg.bp_diastolic_max}`);
          }
          if (cfg.hr_min && v.heart_rate && v.heart_rate < cfg.hr_min) {
            issues.push(`HR ${v.heart_rate} < ${cfg.hr_min}`);
          }
          if (cfg.hr_max && v.heart_rate && v.heart_rate > cfg.hr_max) {
            issues.push(`HR ${v.heart_rate} > ${cfg.hr_max}`);
          }
          if (cfg.o2_min && v.o2_saturation && v.o2_saturation < cfg.o2_min) {
            issues.push(`O2 ${v.o2_saturation}% < ${cfg.o2_min}%`);
          }
          if (issues.length === 0) {
            met = true;
          } else {
            reason = issues.join(", ");
          }
        }
        break;
      }

      case "observation_complete": {
        const cfg = criterion.rule_config;
        const endTime = context.infusionEndedAt || context.treatmentEndedAt;
        if (!endTime) {
          reason = "Infusion not yet ended";
        } else if (cfg.observation_mins) {
          const elapsed = (Date.now() - new Date(endTime).getTime()) / 60000;
          if (elapsed >= cfg.observation_mins) {
            met = true;
          } else {
            reason = `${Math.ceil(cfg.observation_mins - elapsed)} min remaining`;
          }
        } else {
          met = true;
        }
        break;
      }

      case "no_active_reaction":
        if (context.hasActiveReactions === false) {
          met = true;
        } else if (context.hasActiveReactions === true) {
          reason = "Active reaction requires resolution";
        } else {
          met = true; // Assume ok if no data
        }
        break;

      case "patient_alert":
        // Manual check - assume met unless dissociation is high
        if (context.dissociationScore !== null && context.dissociationScore !== undefined && context.dissociationScore > 2) {
          reason = `Dissociation score ${context.dissociationScore} > 2`;
        } else {
          met = true;
        }
        break;

      case "iv_site_checked":
        met = context.ivRemoved ?? false;
        if (!met) reason = "IV not yet removed";
        break;

      case "dissociation_resolved": {
        const cfg = criterion.rule_config;
        const maxScore = cfg.max_dissociation_score ?? 1;
        if (context.dissociationScore === null || context.dissociationScore === undefined) {
          reason = "No dissociation reading";
        } else if (context.dissociationScore <= maxScore) {
          met = true;
        } else {
          reason = `Dissociation ${context.dissociationScore} > ${maxScore}`;
        }
        break;
      }

      default:
        met = true; // Unknown criteria default to met
    }

    results.push({ criterion, met, reason });
    if (criterion.is_required && !met) {
      blockers.push(criterion.display_label + (reason ? `: ${reason}` : ""));
    }
  }

  return {
    isReady: blockers.length === 0,
    criteria: results,
    blockers,
  };
}

// ─── Vitals Thresholds & Alerts ───

export function useVitalsThresholds(protocolId?: string | null) {
  return useQuery({
    queryKey: ["vitals-thresholds", protocolId],
    queryFn: async () => {
      // Try protocol-specific first, then global
      let { data, error } = await supabase
        .from("vitals_thresholds")
        .select("*")
        .eq("is_active", true)
        .eq("protocol_id", protocolId ?? "")
        .maybeSingle();
      
      if (!data) {
        // Fall back to global (null protocol_id)
        const result = await supabase
          .from("vitals_thresholds")
          .select("*")
          .eq("is_active", true)
          .is("protocol_id", null)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return data as VitalsThresholds | null;
    },
  });
}

export function evaluateVitalsAlerts(
  vitals: TreatmentVitals,
  thresholds: VitalsThresholds
): VitalsAlert[] {
  const alerts: VitalsAlert[] = [];

  const check = (
    field: string,
    value: number | null,
    low: number | undefined,
    high: number | undefined,
    label: string
  ) => {
    if (value === null) return;
    if (low !== undefined && value < low) {
      alerts.push({
        field,
        value,
        threshold: { low },
        severity: value < low - 10 ? "critical" : "warning",
        message: `${label} low: ${value} (min ${low})`,
      });
    }
    if (high !== undefined && value > high) {
      alerts.push({
        field,
        value,
        threshold: { high },
        severity: value > high + 20 ? "critical" : "warning",
        message: `${label} high: ${value} (max ${high})`,
      });
    }
  };

  check("blood_pressure_systolic", vitals.blood_pressure_systolic, thresholds.bp_systolic_low, thresholds.bp_systolic_high, "BP Systolic");
  check("blood_pressure_diastolic", vitals.blood_pressure_diastolic, thresholds.bp_diastolic_low, thresholds.bp_diastolic_high, "BP Diastolic");
  check("heart_rate", vitals.heart_rate, thresholds.hr_low, thresholds.hr_high, "Heart Rate");
  check("o2_saturation", vitals.o2_saturation, thresholds.o2_sat_low, undefined, "O₂ Saturation");
  check("temperature", vitals.temperature, thresholds.temp_low, thresholds.temp_high, "Temperature");
  check("respiratory_rate", vitals.respiratory_rate, thresholds.resp_rate_low, thresholds.resp_rate_high, "Respiratory Rate");

  return alerts;
}

// ─── Clinical Alerts ───

export function useClinicalAlerts(treatmentId: string | undefined, status?: ClinicalAlert["status"]) {
  return useQuery({
    queryKey: ["clinical-alerts", treatmentId, status],
    queryFn: async () => {
      if (!treatmentId) return [];
      let query = supabase
        .from("clinical_alerts")
        .select("*")
        .eq("treatment_id", treatmentId)
        .order("triggered_at", { ascending: false });
      
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ClinicalAlert[];
    },
    enabled: !!treatmentId,
  });
}

export function useCreateClinicalAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<ClinicalAlert, "id" | "triggered_at" | "created_at" | "acknowledged_at" | "acknowledged_by" | "resolved_at" | "resolved_by">) => {
      const { data, error } = await supabase
        .from("clinical_alerts")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as ClinicalAlert;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-alerts", data.treatment_id] });
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, userId }: { alertId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("clinical_alerts")
        .update({ status: "acknowledged", acknowledged_at: new Date().toISOString(), acknowledged_by: userId })
        .eq("id", alertId)
        .select()
        .single();
      if (error) throw error;
      return data as ClinicalAlert;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-alerts", data.treatment_id] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, userId }: { alertId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("clinical_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: userId })
        .eq("id", alertId)
        .select()
        .single();
      if (error) throw error;
      return data as ClinicalAlert;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-alerts", data.treatment_id] });
    },
  });
}

// ─── Treatment Summary ───

export function useTreatmentSummary(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-summary", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return null;
      const { data, error } = await supabase
        .from("treatment_summaries")
        .select("*")
        .eq("treatment_id", treatmentId)
        .maybeSingle();
      if (error) throw error;
      return data as TreatmentSummary | null;
    },
    enabled: !!treatmentId,
  });
}

export function useGenerateTreatmentSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      treatmentId,
      userId,
      summaryData,
      narrativeSummary,
    }: {
      treatmentId: string;
      userId: string;
      summaryData: TreatmentSummary["summary_data"];
      narrativeSummary: string;
    }) => {
      const { data, error } = await supabase
        .from("treatment_summaries")
        .upsert({
          treatment_id: treatmentId,
          summary_data: summaryData,
          narrative_summary: narrativeSummary,
          generated_by: userId,
        }, { onConflict: "treatment_id" })
        .select()
        .single();
      if (error) throw error;
      return data as TreatmentSummary;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-summary", data.treatment_id] });
    },
  });
}

// Helper to generate narrative summary from treatment data
export function generateNarrativeSummary(data: {
  patientName: string;
  treatmentType: string;
  startedAt: string;
  endedAt: string;
  durationMins: number;
  vitalsCount: number;
  medicationsAdministered: string[];
  reactionsCount: number;
  ivAccessType?: string;
  dischargeCriteriaMet: string[];
  notes?: string;
}): string {
  const lines: string[] = [];
  
  lines.push(`## Treatment Summary: ${data.treatmentType}`);
  lines.push("");
  lines.push(`**Patient:** ${data.patientName}`);
  lines.push(`**Date:** ${new Date(data.startedAt).toLocaleDateString("en-ZA")}`);
  lines.push(`**Duration:** ${data.durationMins} minutes (${new Date(data.startedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })} – ${new Date(data.endedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })})`);
  lines.push("");
  
  if (data.ivAccessType) {
    lines.push(`**IV Access:** ${data.ivAccessType}`);
  }
  
  lines.push(`**Vitals Recorded:** ${data.vitalsCount} readings`);
  
  if (data.medicationsAdministered.length > 0) {
    lines.push(`**Medications:** ${data.medicationsAdministered.join(", ")}`);
  }
  
  if (data.reactionsCount > 0) {
    lines.push(`**Reactions Documented:** ${data.reactionsCount}`);
  } else {
    lines.push("**Reactions:** None");
  }
  
  lines.push("");
  lines.push("### Discharge");
  lines.push(`All discharge criteria met: ${data.dischargeCriteriaMet.join(", ")}`);
  
  if (data.notes) {
    lines.push("");
    lines.push("### Notes");
    lines.push(data.notes);
  }
  
  return lines.join("\n");
}
