import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GAYLE_EMAIL = "hello@jaimar.dev";

interface SubmitPayload {
  slug: string;
  respondent_first_name: string;
  respondent_last_name: string;
  respondent_email: string;
  respondent_id_number?: string;
  respondent_phone?: string;
  data: Record<string, unknown>;
  signature_data?: string;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderNotificationText(
  formName: string,
  respondent: { first_name: string; last_name: string; email: string; id_number?: string; phone?: string },
  patientId: string,
): string {
  const now = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });
  const portalUrl = `https://infusioncentre.lovable.app/admin/patients/${patientId}?tab=completed-forms`;

  return [
    "NEW FORM SUBMISSION",
    "==================",
    "",
    `Form: ${formName}`,
    `Patient: ${respondent.first_name} ${respondent.last_name}`,
    `Email: ${respondent.email}`,
    `ID Number: ${respondent.id_number || "N/A"}`,
    `Phone: ${respondent.phone || "N/A"}`,
    `Submitted: ${now}`,
    "",
    "View in Admin Portal:",
    portalUrl,
    "",
    "You can view and print the full form from the patient's profile.",
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body: SubmitPayload = await req.json();

    // Validate required fields with clear diagnostics
    const missing: string[] = [];
    if (!body.slug) missing.push("slug");
    if (!body.respondent_email) missing.push("respondent_email");
    if (!body.data) missing.push("data");
    // Name is required but we accept partial (first without last, or vice versa)
    if (!body.respondent_first_name && !body.respondent_last_name) missing.push("respondent_name");

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missing.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default missing name parts to prevent empty patient records
    if (!body.respondent_first_name) body.respondent_first_name = body.respondent_last_name;
    if (!body.respondent_last_name) body.respondent_last_name = body.respondent_first_name;

    // 1. Find form template by slug
    const { data: template, error: tplError } = await adminClient
      .from("form_templates")
      .select("*")
      .eq("slug", body.slug)
      .eq("is_active", true)
      .single();

    if (tplError || !template) {
      return new Response(
        JSON.stringify({ error: "Form not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find or create patient by email
    const email = body.respondent_email.toLowerCase().trim();
    let patientId: string;

    const { data: existingPatient } = await adminClient
      .from("patients")
      .select("id")
      .eq("email", email)
      .eq("tenant_id", template.tenant_id)
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
      const updates: Record<string, string> = {};
      if (body.respondent_id_number) {
        const { data: p } = await adminClient.from("patients").select("id_number").eq("id", patientId).single();
        if (!p?.id_number) updates.id_number = body.respondent_id_number;
      }
      if (body.respondent_phone) {
        const { data: p } = await adminClient.from("patients").select("phone").eq("id", patientId).single();
        if (!p?.phone) updates.phone = body.respondent_phone;
      }
      if (Object.keys(updates).length > 0) {
        await adminClient.from("patients").update(updates).eq("id", patientId);
      }
    } else {
      if (body.respondent_id_number) {
        const { data: byId } = await adminClient
          .from("patients")
          .select("id")
          .eq("id_number", body.respondent_id_number)
          .eq("tenant_id", template.tenant_id)
          .maybeSingle();

        if (byId) {
          patientId = byId.id;
          const { data: p } = await adminClient.from("patients").select("email").eq("id", patientId).single();
          if (!p?.email) {
            await adminClient.from("patients").update({ email }).eq("id", patientId);
          }
        } else {
          const { data: newPatient, error: patError } = await adminClient
            .from("patients")
            .insert({
              first_name: body.respondent_first_name,
              last_name: body.respondent_last_name,
              email,
              phone: body.respondent_phone || null,
              id_number: body.respondent_id_number || null,
              tenant_id: template.tenant_id,
              status: "active",
            })
            .select("id")
            .single();

          if (patError || !newPatient) {
            console.error("Patient create error:", patError);
            return new Response(
              JSON.stringify({ error: "Failed to create patient record" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          patientId = newPatient.id;
        }
      } else {
        const { data: newPatient, error: patError } = await adminClient
          .from("patients")
          .insert({
            first_name: body.respondent_first_name,
            last_name: body.respondent_last_name,
            email,
            phone: body.respondent_phone || null,
            tenant_id: template.tenant_id,
            status: "active",
          })
          .select("id")
          .single();

        if (patError || !newPatient) {
          console.error("Patient create error:", patError);
          return new Response(
            JSON.stringify({ error: "Failed to create patient record" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        patientId = newPatient.id;
      }
    }

    // 3. Insert form submission
    const { error: subError } = await adminClient
      .from("form_submissions")
      .insert({
        form_template_id: template.id,
        patient_id: patientId,
        data: body.data,
        signature_data: body.signature_data || null,
        status: "submitted",
        tenant_id: template.tenant_id,
      });

    if (subError) {
      console.error("Submission insert error:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to save form submission" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Generate notification email
    const respondentInfo = {
      first_name: body.respondent_first_name,
      last_name: body.respondent_last_name,
      email,
      id_number: body.respondent_id_number,
      phone: body.respondent_phone,
    };

    const emailText = renderNotificationText(template.name, respondentInfo, patientId);
    const emailSubject = `Form Submission: ${template.name} - ${body.respondent_first_name} ${body.respondent_last_name}`;

    // 5. Send email
    const host = Deno.env.get("SMTP_HOST")!;
    const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const username = Deno.env.get("SMTP_USERNAME")!;
    const password = Deno.env.get("SMTP_PASSWORD")!;
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL")!;

    try {
      const { data: logData } = await adminClient
        .from("communication_log")
        .insert({
          type: "email",
          recipient: GAYLE_EMAIL,
          subject: emailSubject,
          status: "pending",
          related_entity_type: "form_submission",
          template: "public_form_submission",
          tenant_id: template.tenant_id,
        })
        .select("id")
        .single();

      const logId = logData?.id;

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
        to: GAYLE_EMAIL,
        subject: emailSubject,
        content: emailText,
      });

      await client.close();

      if (logId) {
        await adminClient
          .from("communication_log")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", logId);
      }
    } catch (emailError) {
      console.error("Email send error:", emailError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("submit-public-form error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
