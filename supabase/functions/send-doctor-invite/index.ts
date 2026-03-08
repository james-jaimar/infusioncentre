import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://infusioncentre.lovable.app";

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
      template: "doctor_invite",
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

function buildDoctorInviteHtml(doctorName: string, loginUrl: string): string {
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
          <p style="color:#ffffff;opacity:0.8;margin:8px 0 0;font-size:14px;">Doctor Portal</p>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Welcome, Dr. ${doctorName}!</h2>
          <p style="color:#4a4a4a;font-size:16px;line-height:1.5;">
            You have been registered as a referring doctor on The Johannesburg Infusion Centre's platform. 
            Through your Doctor Portal, you can:
          </p>
          <ul style="color:#4a4a4a;font-size:15px;line-height:1.8;">
            <li><strong>Submit patient referrals</strong> with full clinical details and file attachments</li>
            <li><strong>Track referral status</strong> in real-time from submission through to treatment completion</li>
            <li><strong>Monitor patient progress</strong> across treatment courses with session-by-session updates</li>
            <li><strong>Receive clinical reports</strong> at key treatment milestones</li>
            <li><strong>Manage your profile</strong> and notification preferences</li>
          </ul>
          <table cellpadding="0" cellspacing="0" style="margin:30px 0;">
            <tr><td style="background-color:#3E5B84;border-radius:6px;padding:14px 32px;">
              <a href="${loginUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Log in to Doctor Portal</a>
            </td></tr>
          </table>
          <p style="color:#4a4a4a;font-size:14px;line-height:1.5;">
            Use your registered email address and the temporary password provided by our administration team to log in. 
            We recommend changing your password after your first login.
          </p>
          <p style="color:#999;font-size:12px;margin-top:20px;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${loginUrl}" style="color:#3E5B84;">${loginUrl}</a>
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
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
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { doctor_id, email, doctor_name } = await req.json();

    if (!doctor_id || !email) {
      return new Response(
        JSON.stringify({ error: "doctor_id and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const loginUrl = `${SITE_URL}/login`;
    const displayName = doctor_name || "Doctor";

    const emailResult = await sendEmailViaSMTP({
      to: email,
      subject: "Welcome to The Johannesburg Infusion Centre — Doctor Portal",
      html: buildDoctorInviteHtml(displayName, loginUrl),
      text: `Welcome Dr. ${displayName}! You've been registered on The Johannesburg Infusion Centre's Doctor Portal. Log in at: ${loginUrl}`,
      related_entity_type: "doctor_invite",
      related_entity_id: doctor_id,
    });

    return new Response(
      JSON.stringify({ success: true, email_sent: emailResult.success }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-doctor-invite error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
