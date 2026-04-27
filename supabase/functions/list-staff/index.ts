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
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await callerClient
      .from("user_roles").select("role")
      .eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Get all roles for staff (admin/nurse/doctor)
    const { data: roles, error: rolesError } = await admin
      .from("user_roles").select("user_id, role")
      .in("role", ["admin", "nurse", "doctor"]);
    if (rolesError) throw rolesError;
    if (!roles?.length) {
      return new Response(JSON.stringify({ staff: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(roles.map((r) => r.user_id))];

    const [{ data: profiles }, { data: doctors }] = await Promise.all([
      admin.from("profiles").select("*").in("user_id", userIds),
      admin.from("doctors").select("*").in("user_id", userIds),
    ]);

    // Fetch auth users one by one (admin.listUsers paginates; for the small staff set this is fine)
    const authUsers: Record<string, any> = {};
    await Promise.all(
      userIds.map(async (uid) => {
        const { data } = await admin.auth.admin.getUserById(uid);
        if (data?.user) authUsers[uid] = data.user;
      })
    );

    const staff = (profiles || []).map((p: any) => {
      const au = authUsers[p.user_id];
      const role = roles.find((r) => r.user_id === p.user_id)?.role || "unknown";
      const doc = (doctors || []).find((d: any) => d.user_id === p.user_id);
      const banned = au?.banned_until && new Date(au.banned_until) > new Date();
      return {
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        is_approved: p.is_approved,
        must_change_password: p.must_change_password,
        created_at: p.created_at,
        role,
        email: au?.email || null,
        email_confirmed_at: au?.email_confirmed_at || null,
        last_sign_in_at: au?.last_sign_in_at || null,
        banned_until: au?.banned_until || null,
        is_disabled: !!banned,
        doctor: doc || null,
      };
    });

    return new Response(JSON.stringify({ staff }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});