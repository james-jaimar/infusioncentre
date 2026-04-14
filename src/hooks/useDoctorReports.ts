import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DoctorReportTemplate {
  id: string;
  name: string;
  description: string | null;
  milestone_trigger: string;
  treatment_type_id: string | null;
  subject_template: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DoctorReport {
  id: string;
  template_id: string | null;
  treatment_course_id: string;
  doctor_id: string;
  patient_id: string;
  status: "pending" | "generating" | "review" | "sent" | "acknowledged";
  milestone: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  generated_at: string;
  generated_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  sent_at: string | null;
  acknowledged_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  doctors?: { id: string; email: string | null; practice_name: string | null; user_id: string };
  patients?: { first_name: string; last_name: string };
  treatment_courses?: { status: string; total_sessions_planned: number; sessions_completed: number; appointment_types?: { name: string } };
}

// ─── Report Templates ───

export function useDoctorReportTemplates() {
  return useQuery({
    queryKey: ["doctor_report_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_report_templates")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as DoctorReportTemplate[];
    },
  });
}

export function useCreateReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<DoctorReportTemplate>) => {
      const { data, error } = await supabase
        .from("doctor_report_templates")
        .insert(t as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_report_templates"] });
      toast.success("Report template created");
    },
  });
}

export function useUpdateReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DoctorReportTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("doctor_report_templates")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_report_templates"] });
      toast.success("Report template updated");
    },
  });
}

export function useDeleteReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("doctor_report_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_report_templates"] });
      toast.success("Report template deleted");
    },
  });
}

// ─── Doctor Reports ───

export function useDoctorReports(filters?: {
  status?: string;
  doctorId?: string;
  patientId?: string;
  treatmentCourseId?: string;
}) {
  return useQuery({
    queryKey: ["doctor_reports", filters],
    queryFn: async () => {
      let query = supabase
        .from("doctor_reports")
        .select(`
          *,
          doctors!doctor_reports_doctor_id_fkey(id, email, practice_name, user_id),
          patients!doctor_reports_patient_id_fkey(first_name, last_name),
          treatment_courses!doctor_reports_treatment_course_id_fkey(status, total_sessions_planned, sessions_completed, appointment_types:treatment_type_id(name))
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }
      if (filters?.doctorId) {
        query = query.eq("doctor_id", filters.doctorId);
      }
      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }
      if (filters?.treatmentCourseId) {
        query = query.eq("treatment_course_id", filters.treatmentCourseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DoctorReport[];
    },
  });
}

export function useDoctorReport(id: string | undefined) {
  return useQuery({
    queryKey: ["doctor_report", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("doctor_reports")
        .select(`
          *,
          doctors!doctor_reports_doctor_id_fkey(id, email, practice_name, user_id),
          patients!doctor_reports_patient_id_fkey(first_name, last_name),
          treatment_courses!doctor_reports_treatment_course_id_fkey(status, total_sessions_planned, sessions_completed, appointment_types:treatment_type_id(name))
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DoctorReport;
    },
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      templateId: string;
      treatmentCourseId: string;
      doctorId: string;
      patientId: string;
      milestone: string;
      variables: Record<string, string>;
    }) => {
      // Fetch template
      const { data: template, error: tErr } = await supabase
        .from("doctor_report_templates")
        .select("*")
        .eq("id", params.templateId)
        .single();
      if (tErr) throw tErr;

      // Substitute variables in template
      let subject = template.subject_template;
      let bodyHtml = template.body_template;
      for (const [key, value] of Object.entries(params.variables)) {
        const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        subject = subject.replace(re, value);
        bodyHtml = bodyHtml.replace(re, value);
      }
      // Clean up conditional blocks (simple {{#if}} removal)
      bodyHtml = bodyHtml.replace(/\{\{#if\s+\w+\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => content);
      bodyHtml = bodyHtml.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => params.variables[key] || "");

      const { data, error } = await supabase
        .from("doctor_reports")
        .insert({
          template_id: params.templateId,
          treatment_course_id: params.treatmentCourseId,
          doctor_id: params.doctorId,
          patient_id: params.patientId,
          milestone: params.milestone,
          subject,
          body_html: bodyHtml,
          status: "review" as any,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_reports"] });
      toast.success("Report generated and ready for review");
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DoctorReport> & { id: string }) => {
      const { data, error } = await supabase
        .from("doctor_reports")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_reports"] });
    },
  });
}

export function useSendReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: DoctorReport) => {
      const doctorEmail = (report.doctors as any)?.email;
      if (!doctorEmail) throw new Error("Doctor has no email address");

      // Send via email edge function
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: doctorEmail,
          subject: report.subject,
          html: report.body_html,
          text: report.body_text || undefined,
          related_entity_type: "doctor_report",
          related_entity_id: report.id,
          notification_key: "notify_doctor_patient_progress",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update report status to sent
      const { error: updateErr } = await supabase
        .from("doctor_reports")
        .update({ status: "sent" as any, sent_at: new Date().toISOString() } as any)
        .eq("id", report.id);
      if (updateErr) throw updateErr;

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_reports"] });
      toast.success("Report sent to doctor");
    },
  });
}

export function useAcknowledgeReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("doctor_reports")
        .update({ status: "acknowledged" as any, acknowledged_at: new Date().toISOString() } as any)
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor_reports"] });
      toast.success("Report acknowledged");
    },
  });
}
