import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fillTemplate(
  tpl: string,
  vars: Record<string, string>,
): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{{${k}}}`).join(v),
    tpl,
  );
}

function formatTime(iso: string, tz = "Africa/Johannesburg"): string {
  return new Date(iso).toLocaleTimeString("en-ZA", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string, tz = "Africa/Johannesburg"): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function currentHourSAST(): number {
  const s = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(s, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  try {
    // Load SMS settings (single-tenant assumption matches existing schema).
    const { data: settingsRows } = await admin
      .from("clinic_settings")
      .select("key,value,tenant_id")
      .eq("category", "sms");

    const settings: Record<string, unknown> = {};
    let tenantId: string | null = null;
    (settingsRows ?? []).forEach((r: { key: string; value: unknown; tenant_id: string }) => {
      settings[r.key] = r.value;
      tenantId = r.tenant_id;
    });

    const enabled = settings.sms_enabled === true;
    const sendHour = typeof settings.sms_reminder_send_hour === "number"
      ? settings.sms_reminder_send_hour as number
      : 17;
    const senderId = (settings.sms_sender_id as string) || "InfusionCtr";
    const template = (settings.sms_reminder_template as string) ||
      "Hi {{first_name}}, reminder of your {{treatment_type}} appointment tomorrow at {{time}}.";

    if (!enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "sms disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!force && currentHourSAST() !== sendHour) {
      return new Response(JSON.stringify({ skipped: true, reason: "not send-hour" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: clinicName } = await admin
      .from("clinic_settings")
      .select("value")
      .eq("key", "business_name")
      .maybeSingle();
    const clinic = (clinicName?.value as string) || "the Infusion Centre";

    // Tomorrow window in SAST (UTC+2, no DST).
    const now = new Date();
    const sastNowMs = now.getTime() + 2 * 3600 * 1000;
    const sastTomorrow = new Date(sastNowMs);
    sastTomorrow.setUTCDate(sastTomorrow.getUTCDate() + 1);
    const yyyy = sastTomorrow.getUTCFullYear();
    const mm = String(sastTomorrow.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(sastTomorrow.getUTCDate()).padStart(2, "0");
    const startUTC = new Date(`${yyyy}-${mm}-${dd}T00:00:00+02:00`).toISOString();
    const endUTC = new Date(`${yyyy}-${mm}-${dd}T23:59:59+02:00`).toISOString();

    const { data: appts, error: apptErr } = await admin
      .from("appointments")
      .select(
        "id, scheduled_start, patient_id, patients(id, first_name, phone), appointment_types(name), status",
      )
      .gte("scheduled_start", startUTC)
      .lte("scheduled_start", endUTC)
      .not("status", "in", "(cancelled,no_show)");

    if (apptErr) throw apptErr;

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const details: Array<Record<string, unknown>> = [];

    for (const a of appts ?? []) {
      const phone = (a as any).patients?.phone as string | null;
      const firstName = (a as any).patients?.first_name as string | null;
      const treatment = (a as any).appointment_types?.name as string | null;
      if (!phone) { skipped++; details.push({ id: a.id, skipped: "no phone" }); continue; }

      // Idempotency check
      const { data: existing } = await admin
        .from("appointment_reminders")
        .select("id")
        .eq("appointment_id", a.id)
        .eq("reminder_type", "sms")
        .maybeSingle();
      if (existing) { skipped++; continue; }

      const msg = fillTemplate(template, {
        first_name: firstName ?? "there",
        time: formatTime(a.scheduled_start as string),
        date: formatDate(a.scheduled_start as string),
        treatment_type: treatment ?? "treatment",
        clinic_name: clinic,
      });

      const res = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phone,
          message: msg,
          sender_id: senderId,
          related_entity_type: "appointment",
          related_entity_id: a.id,
          internal: true,
        }),
      });

      const ok = res.ok;
      const errTxt = ok ? null : await res.text();

      await admin.from("appointment_reminders").insert({
        appointment_id: a.id,
        reminder_type: "sms",
        scheduled_for: new Date().toISOString(),
        sent_at: ok ? new Date().toISOString() : null,
        status: ok ? "sent" : "failed",
        error_message: errTxt,
        tenant_id: tenantId,
      });

      if (ok) sent++; else failed++;
      details.push({ id: a.id, ok, error: errTxt });
    }

    return new Response(
      JSON.stringify({ ran_at: new Date().toISOString(), sent, skipped, failed, details }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("dispatch-appointment-reminders error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});