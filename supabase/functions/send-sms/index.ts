import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendSmsPayload {
  to: string;
  message: string;
  sender_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  // When invoked by an internal cron worker with the service-role key,
  // skip the caller-auth role check.
  internal?: boolean;
}

function normalizeMsisdn(raw: string): string {
  // SMSPortal accepts E.164 without the +. Default to ZA (+27) if a local
  // number starting with 0 is provided.
  let v = (raw ?? "").replace(/\s|-|\(|\)/g, "");
  if (v.startsWith("+")) v = v.slice(1);
  else if (v.startsWith("0")) v = "27" + v.slice(1);
  return v;
}

async function getSmsPortalToken(): Promise<string> {
  const id = Deno.env.get("SMSPORTAL_CLIENT_ID");
  const secret = Deno.env.get("SMSPORTAL_API_SECRET");
  if (!id || !secret) throw new Error("SMSPortal credentials not configured");
  const basic = btoa(`${id}:${secret}`);
  const res = await fetch("https://rest.smsportal.com/v1/Authentication", {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SMSPortal auth failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  const token = json?.token ?? json?.Token;
  if (!token) throw new Error("SMSPortal auth returned no token");
  return token as string;
}

async function sendViaSmsPortal(
  to: string,
  message: string,
  senderId?: string,
): Promise<{ ok: true; eventId?: string } | { ok: false; error: string }> {
  try {
    const token = await getSmsPortalToken();
    const body = {
      messages: [
        {
          content: message,
          destination: to,
          ...(senderId ? { sender: senderId } : {}),
        },
      ],
    };
    const res = await fetch("https://rest.smsportal.com/v1/BulkMessages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${txt}` };
    let eventId: string | undefined;
    try {
      const j = JSON.parse(txt);
      eventId = j?.eventId ?? j?.EventId ?? j?.data?.eventId;
    } catch { /* non-JSON success */ }
    return { ok: true, eventId };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body: SendSmsPayload = await req.json();
    if (!body?.to || !body?.message) {
      return new Response(
        JSON.stringify({ error: "to and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Caller auth: either internal service-role call, or admin/nurse user.
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    const isInternal = body.internal === true && bearer === serviceRoleKey;

    if (!isInternal) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: caller } } = await callerClient.auth.getUser();
      if (!caller) {
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
        return new Response(
          JSON.stringify({ error: "Admin or nurse access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const msisdn = normalizeMsisdn(body.to);
    if (msisdn.length < 8) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: logRow } = await adminClient
      .from("communication_log")
      .insert({
        type: "sms",
        recipient: msisdn,
        subject: body.message.slice(0, 80),
        status: "pending",
        related_entity_type: body.related_entity_type ?? null,
        related_entity_id: body.related_entity_id ?? null,
        template: body.related_entity_type ?? null,
      })
      .select("id")
      .single();

    const result = await sendViaSmsPortal(msisdn, body.message, body.sender_id);

    if (logRow?.id) {
      await adminClient
        .from("communication_log")
        .update(
          result.ok
            ? { status: "sent", sent_at: new Date().toISOString() }
            : { status: "failed", error_message: result.error },
        )
        .eq("id", logRow.id);
    }

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, eventId: result.eventId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-sms error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});