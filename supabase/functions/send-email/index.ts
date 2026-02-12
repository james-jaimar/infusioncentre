import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

async function sendEmailViaSMTP(payload: SendEmailPayload): Promise<{ success: boolean; error?: string }> {
  const host = Deno.env.get("SMTP_HOST")!;
  const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const username = Deno.env.get("SMTP_USERNAME")!;
  const password = Deno.env.get("SMTP_PASSWORD")!;
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  let logId: string | undefined;

  try {
    const { data: logData } = await adminClient
      .from("communication_log")
      .insert({
        type: "email",
        recipient: payload.to,
        subject: payload.subject,
        status: "pending",
        related_entity_type: payload.related_entity_type || null,
        related_entity_id: payload.related_entity_id || null,
        template: payload.related_entity_type || null,
      })
      .select("id")
      .single();

    logId = logData?.id;

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: port === 465,
        auth: { username, password },
      },
    });

    await client.send({
      from: fromEmail,
      to: payload.to,
      subject: payload.subject,
      content: payload.text || "",
      html: payload.html,
    });

    await client.close();

    if (logId) {
      await adminClient
        .from("communication_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", logId);
    }

    return { success: true };
  } catch (error) {
    console.error("SMTP send error:", error);
    if (logId) {
      await adminClient
        .from("communication_log")
        .update({ status: "failed", error_message: error.message })
        .eq("id", logId);
    }
    return { success: false, error: error.message };
  }
}

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
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

    const body: SendEmailPayload = await req.json();

    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({ error: "to, subject, and html are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendEmailViaSMTP(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
