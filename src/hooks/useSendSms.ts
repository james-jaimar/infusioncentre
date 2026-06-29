import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSendTestSms() {
  return useMutation({
    mutationFn: async (payload: { to: string; message: string; sender_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });
}

export function useRunReminderDispatchNow() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "dispatch-appointment-reminders?force=1",
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { sent: number; skipped: number; failed: number };
    },
  });
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{{${k}}}`).join(v),
    tpl,
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export interface SendAppointmentSmsInput {
  appointmentId: string;
  phone: string;
  firstName: string | null;
  scheduledStart: string;
  treatmentType: string | null;
  confirmationToken?: string | null;
}

export function useSendAppointmentConfirmationSms() {
  return useMutation({
    mutationFn: async (input: SendAppointmentSmsInput) => {
      // Load SMS settings + clinic name
      const { data: rows, error: sErr } = await supabase
        .from("clinic_settings")
        .select("key,value")
        .in("key", [
          "sms_enabled",
          "sms_sender_id",
          "sms_reminder_template",
          "sms_confirm_base_url",
          "business_name",
        ]);
      if (sErr) throw sErr;
      const s: Record<string, unknown> = {};
      (rows ?? []).forEach((r: any) => { s[r.key] = r.value; });

      const template = (s.sms_reminder_template as string) ||
        "Hi {{first_name}}, reminder of your {{treatment_type}} appointment tomorrow at {{time}}. Tap {{confirm_link}} to confirm.";
      const base = ((s.sms_confirm_base_url as string) ||
        "https://infusioncentre.jaimar.dev").replace(/\/$/, "");
      const senderId = (s.sms_sender_id as string) || undefined;
      const clinic = (s.business_name as string) || "the Infusion Centre";

      let token = input.confirmationToken ?? null;
      if (!token) {
        // Generate one so the {{confirm_link}} works for manual sends too.
        token = crypto.randomUUID();
        await supabase
          .from("appointments")
          .update({ confirmation_token: token })
          .eq("id", input.appointmentId);
      }

      const message = fillTemplate(template, {
        first_name: input.firstName ?? "there",
        time: formatTime(input.scheduledStart),
        date: formatDate(input.scheduledStart),
        treatment_type: input.treatmentType ?? "treatment",
        clinic_name: clinic,
        confirm_link: `${base}/appointment/confirm/${token}`,
      });

      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          to: input.phone,
          message,
          sender_id: senderId,
          related_entity_type: "appointment",
          related_entity_id: input.appointmentId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { ...data, message };
    },
  });
}