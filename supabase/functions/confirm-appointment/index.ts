import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const token = (url.searchParams.get("token") ?? (body as any).token) as string | undefined;
    const action = ((url.searchParams.get("action") ?? (body as any).action ?? "info") as string).toLowerCase();
    const message = ((body as any).message ?? "") as string;
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load branding
    const { data: brandRows } = await admin
      .from("clinic_settings")
      .select("key,value")
      .in("key", ["business_name", "business_phone", "business_email"]);
    const brand: Record<string, string> = {};
    (brandRows ?? []).forEach((r: any) => {
      const v = typeof r.value === "string" ? r.value : (r.value?.value ?? "");
      brand[r.key] = String(v ?? "");
    });

    const { data: appt, error } = await admin
      .from("appointments")
      .select("id, tenant_id, scheduled_start, patient_confirmed_at, status, cancellation_reason, patients(id, first_name, last_name), appointment_types(name)")
      .eq("confirmation_token", token)
      .maybeSingle();
    if (error) throw error;
    if (!appt) {
      return new Response(JSON.stringify({ error: "Invalid link" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let actionResult: string | null = null;

    if (action === "confirm") {
      if (!appt.patient_confirmed_at) {
        await admin
          .from("appointments")
          .update({
            patient_confirmed_at: new Date().toISOString(),
            status: appt.status === "scheduled" ? "confirmed" : appt.status,
          })
          .eq("id", appt.id);
      }
      actionResult = "confirmed";
    } else if (action === "cancel") {
      await admin
        .from("appointments")
        .update({
          status: "cancelled",
          cancellation_reason: message?.trim() || "Cancelled by patient via SMS link",
        })
        .eq("id", appt.id);
      actionResult = "cancelled";
    } else if (action === "request_change") {
      const patientId = (appt as any).patients?.id ?? null;
      const when = new Date((appt as any).scheduled_start).toLocaleString("en-ZA", {
        timeZone: "Africa/Johannesburg",
      });
      const note = `📱 Patient requested a date change via SMS confirmation link.\nOriginal appointment: ${when}\nMessage: ${message?.trim() || "(none provided)"}`;
      if (patientId) {
        await admin.from("patient_notes").insert({
          patient_id: patientId,
          tenant_id: (appt as any).tenant_id,
          content: note,
        });
      }
      actionResult = "change_requested";
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: actionResult,
        already: !!appt.patient_confirmed_at,
        status: actionResult === "cancelled" ? "cancelled" : appt.status,
        scheduled_start: appt.scheduled_start,
        patient_name: `${(appt as any).patients?.first_name ?? ""} ${(appt as any).patients?.last_name ?? ""}`.trim(),
        treatment_type: (appt as any).appointment_types?.name ?? null,
        brand: {
          name: brand.business_name || "Infusion Centre",
          phone: brand.business_phone || "",
          email: brand.business_email || "",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});