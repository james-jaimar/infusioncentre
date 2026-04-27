import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { data: roleData } = await callerClient
      .from("user_roles").select("role")
      .eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const body = await req.json();
    const { user_id, first_name, last_name, phone, email, role, practice_name, practice_number, specialisation } = body;
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (role && !["admin", "nurse", "doctor"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Update profile fields
    await admin.from("profiles").update({
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      phone: phone ?? null,
    }).eq("user_id", user_id);

    // Update email if provided
    if (email) {
      const { error: emailErr } = await admin.auth.admin.updateUserById(user_id, {
        email, email_confirm: true,
      });
      if (emailErr) throw emailErr;
    }

    // Role change with cascade for doctors row
    if (role) {
      const { data: existingRole } = await admin
        .from("user_roles").select("role").eq("user_id", user_id).maybeSingle();
      const oldRole = existingRole?.role;

      if (oldRole !== role) {
        await admin.from("user_roles").update({ role }).eq("user_id", user_id);

        if (oldRole === "doctor" && role !== "doctor") {
          await admin.from("doctors").delete().eq("user_id", user_id);
        }
        if (role === "doctor" && oldRole !== "doctor") {
          const { data: au } = await admin.auth.admin.getUserById(user_id);
          await admin.from("doctors").insert({
            user_id,
            email: au?.user?.email || null,
            phone: phone ?? null,
            practice_name: practice_name ?? null,
            practice_number: practice_number ?? null,
            specialisation: specialisation ?? null,
            must_change_password: false,
          });
        }
      }

      if (role === "doctor") {
        await admin.from("doctors").update({
          practice_name: practice_name ?? null,
          practice_number: practice_number ?? null,
          specialisation: specialisation ?? null,
          phone: phone ?? null,
        }).eq("user_id", user_id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});