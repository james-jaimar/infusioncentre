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