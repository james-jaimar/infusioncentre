import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Global admin realtime listener. Mounted once inside AdminLayout.
 * Fires toast notifications for the events Gayle needs to react to:
 *  - New patient reschedule request
 *  - Patient confirms an appointment via SMS
 *  - New inbound patient/doctor message
 * Also updates the browser tab title with an unread-action counter so
 * a backgrounded tab signals activity.
 */
export default function RealtimeNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const mounted = useRef(false);

  // Give React a beat before we start reacting to events, so we don't
  // re-toast rows that were already in the initial fetch.
  useEffect(() => {
    const t = setTimeout(() => {
      mounted.current = true;
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("admin-realtime-notifications")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "appointment_change_requests" },
        async (payload: any) => {
          qc.invalidateQueries({ queryKey: ["appointment-change-requests"] });
          if (!mounted.current) return;
          const patientId = payload.new?.patient_id;
          let name = "";
          if (patientId) {
            const { data } = await supabase
              .from("patients")
              .select("first_name, last_name")
              .eq("id", patientId)
              .maybeSingle();
            if (data) name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
          }
          toast.warning(name ? `${name} requested a reschedule` : "New reschedule request", {
            description: payload.new?.reason || "Open the dashboard action list to respond.",
            action: { label: "View", onClick: () => navigate("/admin") },
          });
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "appointments" },
        async (payload: any) => {
          qc.invalidateQueries({ queryKey: ["appointments"] });
          qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
          if (!mounted.current) return;
          const wasUnconfirmed = !payload.old?.patient_confirmed_at;
          const nowConfirmed = !!payload.new?.patient_confirmed_at;
          if (!(wasUnconfirmed && nowConfirmed)) return;
          const patientId = payload.new?.patient_id;
          let name = "";
          if (patientId) {
            const { data } = await supabase
              .from("patients")
              .select("first_name, last_name")
              .eq("id", patientId)
              .maybeSingle();
            if (data) name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
          }
          const time = payload.new?.scheduled_start
            ? new Date(payload.new.scheduled_start).toLocaleString([], {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          toast.success(name ? `${name} confirmed their appointment` : "Appointment confirmed", {
            description: time || undefined,
          });
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload: any) => {
          qc.invalidateQueries({ queryKey: ["unread-message-count"] });
          qc.invalidateQueries({ queryKey: ["unread-patient-messages"] });
          if (!mounted.current) return;
          const senderId = payload.new?.sender_id;
          if (senderId === user.id) return;
          const senderRole = payload.new?.sender_role;
          const patientId = payload.new?.patient_id;
          let name = "";
          if (patientId) {
            const { data } = await supabase
              .from("patients")
              .select("first_name, last_name")
              .eq("id", patientId)
              .maybeSingle();
            if (data) name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
          }
          const label = senderRole === "doctor" ? "New doctor message" : "New patient message";
          toast(name ? `${label} — ${name}` : label, {
            description: (payload.new?.content || "").slice(0, 140),
            action: patientId
              ? {
                  label: "Open",
                  onClick: () => navigate(`/admin/patients/${patientId}?tab=messages`),
                }
              : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc, navigate]);

  // Tab-title pulse: reflect unread count when tab is backgrounded.
  useEffect(() => {
    const baseTitle = document.title.replace(/^\(\d+\)\s*/, "");
    const applyTitle = () => {
      const state = qc.getQueryState<number>(["unread-message-count", user?.id]);
      const acr = qc.getQueryData<any[]>(["appointment-change-requests", "pending"]);
      const count = (state?.data ?? 0) + (acr?.length ?? 0);
      document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
    };
    applyTitle();
    const unsub = qc.getQueryCache().subscribe(applyTitle);
    return () => {
      unsub();
      document.title = baseTitle;
    };
  }, [qc, user?.id]);

  return null;
}