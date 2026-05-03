import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

async function sendEmailViaSMTP(payload: {
  to: string; subject: string; html: string; text?: string;
  related_entity_type?: string; related_entity_id?: string;
}): Promise<{ success: boolean; error?: string }> {
  const host = Deno.env.get("SMTP_HOST")!;
  const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const username = Deno.env.get("SMTP_USERNAME")!;
  const password = Deno.env.get("SMTP_PASSWORD")!;
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const logClient = createClient(supabaseUrl, serviceRoleKey);

  let logId: string | undefined;
  try {
    const { data: logData } = await logClient.from("communication_log").insert({
      type: "email", recipient: payload.to, subject: payload.subject, status: "pending",
      related_entity_type: payload.related_entity_type || null,
      related_entity_id: payload.related_entity_id || null,
      template: payload.related_entity_type || null,
    }).select("id").single();
    logId = logData?.id;

    const client = new SMTPClient({
      connection: { hostname: host, port, tls: port === 465, auth: { username, password } },
    });
    await client.send({ from: fromEmail, to: payload.to, subject: payload.subject, content: payload.text || "", html: payload.html });
    await client.close();

    if (logId) await logClient.from("communication_log").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", logId);
    return { success: true };
  } catch (error) {
    console.error("SMTP send error:", error);
    if (logId) await logClient.from("communication_log").update({ status: "failed", error_message: error.message }).eq("id", logId);
    return { success: false, error: error.message };
  }
}

const SITE_URL = "https://infusioncentre.lovable.app";

function buildInviteEmailHtml(patientName: string, inviteLink: string, expiresAt: string): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-ZA", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background-color:#3E5B84;padding:30px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">The Johannesburg Infusion Centre</h1>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Welcome, ${patientName}!</h2>
          <p style="color:#4a4a4a;font-size:16px;line-height:1.5;">
            You've been invited to register on the patient portal for The Johannesburg Infusion Centre.
            Click the button below to create your account and complete your onboarding forms.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:30px 0;">
            <tr><td style="background-color:#3E5B84;border-radius:6px;padding:14px 32px;">
              <a href="${inviteLink}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Register Now</a>
            </td></tr>
          </table>
          <p style="color:#4a4a4a;font-size:14px;line-height:1.5;">
            This invitation expires on <strong>${expiryDate}</strong>.
          </p>
          <p style="color:#999;font-size:12px;margin-top:20px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${inviteLink}" style="color:#3E5B84;">${inviteLink}</a>
          </p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:20px 30px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">
            The Johannesburg Infusion Centre<br/>
            This is an automated message, please do not reply.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { action } = body;

    // Handle accept action — called by newly registered patients (no role check needed)
    if (action === "accept") {
      const { token: inviteToken, user_id } = body;
      if (!inviteToken || !user_id) {
        return new Response(
          JSON.stringify({ error: "token and user_id are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);

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

      await Promise.all([
        adminClient.from("patients").update({ user_id }).eq("id", inviteData.patient_id),
        adminClient.from("profiles").update({ is_approved: true }).eq("user_id", user_id),
        adminClient.from("patient_invites").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", inviteData.id),
      ]);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All other actions require admin/nurse auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Handle link-account action — admin recovery tool for stuck accounts
    if (action === "link-account") {
      const { patient_id, email } = body;
      if (!patient_id || !email) {
        return new Response(
          JSON.stringify({ error: "patient_id and email are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      // Look up auth user by email
      const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) {
        return new Response(
          JSON.stringify({ error: "Failed to search users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const matchedUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (!matchedUser) {
        return new Response(
          JSON.stringify({ error: "No auth account found with this email. The patient needs to register first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Link patient record, approve profile, and mark invites as accepted
      await Promise.all([
        adminClient.from("patients").update({ user_id: matchedUser.id }).eq("id", patient_id),
        adminClient.from("profiles").update({ is_approved: true }).eq("user_id", matchedUser.id),
        adminClient.from("patient_invites")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("patient_id", patient_id)
          .eq("status", "pending"),
      ]);

      return new Response(
        JSON.stringify({ success: true, user_id: matchedUser.id }),
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
        if (t.required_for_treatment_types === null) return true; // universal (NULL only)
        if (!t.required_for_treatment_types.length) return false;
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

    // Fetch patient name for the email
    const { data: patientData } = await adminClient
      .from("patients")
      .select("first_name, last_name")
      .eq("id", patient_id)
      .single();

    const patientName = patientData
      ? `${patientData.first_name} ${patientData.last_name}`
      : "Patient";

    // Send invite email
    const inviteLink = `${SITE_URL}/invite/${invite.token}`;
    const emailResult = await sendEmailViaSMTP({
      to: email,
      subject: "You're invited — The Johannesburg Infusion Centre",
      html: buildInviteEmailHtml(patientName, inviteLink, invite.expires_at),
      text: `Hi ${patientName}, you've been invited to register at The Johannesburg Infusion Centre. Visit: ${inviteLink}`,
      related_entity_type: "patient_invite",
      related_entity_id: invite.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailResult.success,
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
