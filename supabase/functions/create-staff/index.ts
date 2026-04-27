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
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client using caller's JWT to verify role
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

    // Check admin role
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

    const body = await req.json();
    const { email, password, first_name, last_name, phone, role, practice_name, practice_number, specialisation, send_invite } = body;

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "email and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!send_invite && !password) {
      return new Response(
        JSON.stringify({ error: "password is required when not sending an invite email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["admin", "nurse", "doctor"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Role must be admin, nurse, or doctor" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Create auth user — pass user_metadata so the handle_new_user trigger
    // creates the profile with the correct name. If sending invite, set a
    // random password the user will overwrite via the reset link.
    const tempPassword = send_invite
      ? crypto.randomUUID() + "Aa1!"
      : password;
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: first_name || null,
        last_name: last_name || null,
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // Small delay to let the handle_new_user trigger complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // UPDATE profile (trigger already created it) to set is_approved = true and names
    await adminClient.from("profiles").update({
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      is_approved: true,
    }).eq("user_id", userId);

    // The handle_new_user trigger inserts a 'patient' role row by default.
    // Wipe any existing rows for this user and insert exactly one row with
    // the correct staff role to avoid duplicates causing mis-routing.
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // Look up the caller's tenant for the new role row
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", caller.id)
      .maybeSingle();
    const tenantId =
      (callerProfile as any)?.tenant_id ||
      "00000000-0000-0000-0000-000000000001";

    await adminClient.from("user_roles").insert({
      user_id: userId,
      role,
      tenant_id: tenantId,
    });

    // If doctor, also create a doctors table entry
    if (role === "doctor") {
      await adminClient.from("doctors").insert({
        user_id: userId,
        practice_name: practice_name || null,
        practice_number: practice_number || null,
        phone: phone || null,
        email: email,
        specialisation: specialisation || null,
        must_change_password: !send_invite,
      });
    }

    // If invite mode, trigger a password reset email so the user can set their own password
    if (send_invite) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/password-reset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ email }),
        });
      } catch (e) {
        console.error("Failed to send invite email:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email, first_name, last_name, phone, role },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
