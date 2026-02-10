import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller role
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin or nurse role
    const { data: roleData } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["admin", "nurse"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin or nurse access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // Handle accept action (called by patient during registration)
    if (action === "accept") {
      const { token: inviteToken, user_id } = body;
      if (!inviteToken || !user_id) {
        return new Response(
          JSON.stringify({ error: "token and user_id are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      // Get the invite
      const { data: inviteData, error: inviteErr } = await adminClient
        .from("patient_invites")
        .select("*")
        .eq("token", inviteToken)
        .eq("status", "pending")
        .maybeSingle();

      if (inviteErr || !inviteData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired invite" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Link patient record to the new user
      await adminClient
        .from("patients")
        .update({ user_id })
        .eq("id", inviteData.patient_id);

      // Mark invite as accepted
      await adminClient
        .from("patient_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", inviteData.id);

      // Delete the default 'patient' role created by trigger (we already have it, but ensure consistency)
      // The handle_new_user trigger already creates the patient role, so we're good.

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { patient_id, email, phone, treatment_type_ids } = body;

    if (!patient_id || !email) {
      return new Response(
        JSON.stringify({ error: "patient_id and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Generate secure token
    const token = crypto.randomUUID();

    // Revoke any existing pending invites for this patient
    await adminClient
      .from("patient_invites")
      .update({ status: "revoked" })
      .eq("patient_id", patient_id)
      .eq("status", "pending");

    // Create invite record
    const { data: invite, error: inviteError } = await adminClient
      .from("patient_invites")
      .insert({
        patient_id,
        token,
        email,
        phone: phone || null,
        invited_by: caller.id,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Invite creation error:", inviteError);
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-generate onboarding checklist if not already present
    const { data: existingChecklist } = await adminClient
      .from("onboarding_checklists")
      .select("id")
      .eq("patient_id", patient_id)
      .limit(1);

    if (!existingChecklist || existingChecklist.length === 0) {
      // Get applicable form templates
      const { data: templates } = await adminClient
        .from("form_templates")
        .select("id, required_for_treatment_types")
        .eq("is_active", true);

      const applicable = (templates || []).filter((t: any) => {
        if (!t.required_for_treatment_types) return true; // universal
        if (!treatment_type_ids?.length) return false;
        return t.required_for_treatment_types.some((id: string) => treatment_type_ids.includes(id));
      });

      if (applicable.length > 0) {
        const items = applicable.map((t: any) => ({
          patient_id,
          form_template_id: t.id,
        }));
        await adminClient.from("onboarding_checklists").insert(items);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invite: {
          id: invite.id,
          token: invite.token,
          email: invite.email,
          status: invite.status,
          expires_at: invite.expires_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-patient-invite error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
