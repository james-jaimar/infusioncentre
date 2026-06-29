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
    const token = url.searchParams.get("token") ?? (await req.json().catch(() => ({}))).token;
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: appt, error } = await admin
      .from("appointments")
      .select("id, scheduled_start, patient_confirmed_at, status, patients(first_name, last_name), appointment_types(name)")
      .eq("confirmation_token", token)
      .maybeSingle();
    if (error) throw error;
    if (!appt) {
      return new Response(JSON.stringify({ error: "Invalid link" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!appt.patient_confirmed_at) {
      await admin
        .from("appointments")
        .update({ patient_confirmed_at: new Date().toISOString() })
        .eq("id", appt.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        already: !!appt.patient_confirmed_at,
        scheduled_start: appt.scheduled_start,
        patient_name: `${(appt as any).patients?.first_name ?? ""} ${(appt as any).patients?.last_name ?? ""}`.trim(),
        treatment_type: (appt as any).appointment_types?.name ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});