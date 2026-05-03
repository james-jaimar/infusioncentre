import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_SITE_URL = "https://infusioncentre.jmar.dev";

function resolveSiteUrl(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const referer = req.headers.get("referer");
  if (referer) {
    try { return new URL(referer).origin; } catch (_) { /* ignore */ }
  }
  return FALLBACK_SITE_URL;
}

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
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  let logId: string | undefined;
  let client: SMTPClient | undefined;
  try {
    const { data: logData } = await adminClient.from("communication_log").insert({
      type: "email", recipient: payload.to, subject: payload.subject, status: "pending",
      related_entity_type: payload.related_entity_type || null,
      related_entity_id: payload.related_entity_id || null,
      template: payload.related_entity_type || null,
    }).select("id").single();
    logId = logData?.id;

    client = new SMTPClient({
      connection: { hostname: host, port, tls: port === 465, auth: { username, password } },
    });
    await client.send({ from: fromEmail, to: payload.to, subject: payload.subject, content: payload.text || "", html: payload.html });

    if (logId) await adminClient.from("communication_log").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", logId);
    return { success: true };
  } catch (error) {
    console.error("SMTP send error:", error);
    if (logId) await adminClient.from("communication_log").update({ status: "failed", error_message: error.message }).eq("id", logId);
    return { success: false, error: error.message };
  } finally {
    try { await client?.close(); } catch (_) { /* ignore */ }
  }
}

// Fire-and-forget background dispatch so the HTTP response returns immediately.
function dispatchEmail(payload: Parameters<typeof sendEmailViaSMTP>[0]) {
  const task = sendEmailViaSMTP(payload).catch((e) => console.error("Background email error:", e));
  // @ts-ignore EdgeRuntime is available in Supabase Edge runtime
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(task);
  }
}

function buildResetEmailHtml(resetLink: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background-color:#3E5B84;padding:30px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">The Johannesburg Infusion Centre</h1>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Password Reset Request</h2>
          <p style="color:#4a4a4a;font-size:16px;line-height:1.5;">We received a request to reset your password. Click the button below to set a new password.</p>
          <table cellpadding="0" cellspacing="0" style="margin:30px 0;">
            <tr><td style="background-color:#3E5B84;border-radius:6px;padding:14px 32px;">
              <a href="${resetLink}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Reset Password</a>
            </td></tr>
          </table>
          <p style="color:#4a4a4a;font-size:14px;line-height:1.5;">This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#999;font-size:12px;margin-top:20px;">If the button doesn't work, copy and paste this link:<br/><a href="${resetLink}" style="color:#3E5B84;">${resetLink}</a></p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:20px 30px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">The Johannesburg Infusion Centre<br/>This is an automated message, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function verifyAdmin(req: Request, adminClient: any): Promise<{ isAdmin: boolean; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { isAdmin: false, error: "Unauthorized" };

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller) return { isAdmin: false, error: "Unauthorized" };

  const { data: roleData } = await callerClient
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return { isAdmin: false, error: "Admin access required" };
  return { isAdmin: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const siteUrl = resolveSiteUrl(req);

    const body = await req.json();
    const { action } = body;

    if (action === "request") {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: userData } = await adminClient.auth.admin.listUsers();
      const user = userData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      // Always return success to prevent email enumeration
      if (!user) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Invalidate existing tokens
      await adminClient.from("password_reset_tokens").update({ used: true }).eq("user_id", user.id).eq("used", false);

      const token = crypto.randomUUID() + "-" + crypto.randomUUID();

      const { error: insertError } = await adminClient.from("password_reset_tokens").insert({
        user_id: user.id, token, email: email.toLowerCase(),
      });

      if (insertError) {
        console.error("Token insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create reset token" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resetLink = `${siteUrl}/reset-password?token=${token}`;
      dispatchEmail({
        to: email,
        subject: "Reset your password — The Johannesburg Infusion Centre",
        html: buildResetEmailHtml(resetLink),
        text: `Reset your password by visiting: ${resetLink}\n\nThis link expires in 1 hour.`,
        related_entity_type: "password_reset",
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "validate") {
      const { token } = body;
      if (!token) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tokenData } = await adminClient.from("password_reset_tokens")
        .select("*").eq("token", token).eq("used", false)
        .gte("expires_at", new Date().toISOString()).maybeSingle();

      return new Response(JSON.stringify({ valid: !!tokenData }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset") {
      const { token, password } = body;
      if (!token || !password) {
        return new Response(JSON.stringify({ error: "Token and password are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (password.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tokenData } = await adminClient.from("password_reset_tokens")
        .select("*").eq("token", token).eq("used", false)
        .gte("expires_at", new Date().toISOString()).maybeSingle();

      if (!tokenData) {
        return new Response(JSON.stringify({ error: "Invalid or expired reset token" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(tokenData.user_id, { password });

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update password" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("password_reset_tokens").update({ used: true }).eq("id", tokenData.id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: send password reset email for a specific user
    if (action === "admin-reset-email") {
      const { isAdmin, error: authError } = await verifyAdmin(req, adminClient);
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: authError }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(user_id);
      if (userError || !userData?.user?.email) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const email = userData.user.email;

      // Invalidate existing tokens
      await adminClient.from("password_reset_tokens").update({ used: true }).eq("user_id", user_id).eq("used", false);

      const token = crypto.randomUUID() + "-" + crypto.randomUUID();
      await adminClient.from("password_reset_tokens").insert({
        user_id, token, email: email.toLowerCase(),
      });

      const resetLink = `${siteUrl}/reset-password?token=${token}`;
      dispatchEmail({
        to: email,
        subject: "Reset your password — The Johannesburg Infusion Centre",
        html: buildResetEmailHtml(resetLink),
        text: `Reset your password by visiting: ${resetLink}\n\nThis link expires in 1 hour.`,
        related_entity_type: "password_reset",
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin: set password directly
    if (action === "admin-set-password") {
      const { isAdmin, error: authError } = await verifyAdmin(req, adminClient);
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: authError }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { user_id, password } = body;
      if (!user_id || !password) {
        return new Response(JSON.stringify({ error: "user_id and password are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (password.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, { password });

      if (updateError) {
        console.error("Admin set password error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update password" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("password-reset error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
