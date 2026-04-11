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

function renderNotificationEmail(
  formName: string,
  respondent: { first_name: string; last_name: string; email: string; id_number?: string; phone?: string },
  patientId: string,
): string {
  const now = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });
  const portalUrl = `https://infusioncentre.lovable.app/admin/patients/${patientId}?tab=onboarding`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#fff;">
  <div style="max-width:560px;margin:0 auto;">
    <h2 style="color:#1F3A5F;margin:0 0 16px;">New Form Submission</h2>
    <table style="font-size:14px;line-height:1.6;">
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Form:</td><td>${escapeHtml(formName)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Patient:</td><td>${escapeHtml(respondent.first_name)} ${escapeHtml(respondent.last_name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Email:</td><td>${escapeHtml(respondent.email)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">ID Number:</td><td>${escapeHtml(respondent.id_number || "—")}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Phone:</td><td>${escapeHtml(respondent.phone || "—")}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Submitted:</td><td>${now}</td></tr>
    </table>
    <div style="margin-top:20px;">
      <a href="${portalUrl}" style="display:inline-block;background:#1F3A5F;color:#fff;padding:10px 24px;text-decoration:none;border-radius:4px;font-size:14px;">View in Admin Portal</a>
    </div>
    <p style="margin-top:24px;font-size:11px;color:#999;">You can view and print the full form from the patient's profile in the admin portal.</p>
  </div>
</body></html>`;
}

// ─── Schema-based renderer (existing) ───

function renderFormToPdfHtml(
  formName: string,
  schema: any[],
  data: Record<string, unknown>,
  respondent: { first_name: string; last_name: string; email: string; id_number?: string; phone?: string },
  signatureData?: string
): string {
  const now = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

  let fieldsHtml = "";

  for (const field of schema) {
    if (field.field_type === "section_header") {
      fieldsHtml += `<tr><td colspan="2" style="background:#e8eff7;padding:10px 14px;font-weight:bold;font-size:14px;color:#1a3a5c;border-bottom:2px solid #3E5B84;">${escapeHtml(field.label)}</td></tr>`;
      continue;
    }

    if (field.field_type === "info_text") {
      fieldsHtml += `<tr><td colspan="2" style="padding:8px 14px;font-size:12px;color:#666;font-style:italic;background:#f9fafb;">${escapeHtml(field.content || "")}</td></tr>`;
      continue;
    }

    if (field.field_type === "signature") {
      const sigData = data[field.field_name] as string;
      if (sigData) {
        fieldsHtml += `<tr><td style="padding:8px 14px;font-weight:600;font-size:13px;color:#333;width:35%;vertical-align:top;">${escapeHtml(field.label)}</td><td style="padding:8px 14px;"><img src="${sigData}" style="max-height:80px;border:1px solid #ddd;border-radius:4px;" /></td></tr>`;
      }
      continue;
    }

    const val = data[field.field_name];
    let displayVal = "—";

    if (val !== undefined && val !== null && val !== "") {
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === "object") {
          const rows = val as Record<string, string>[];
          if (rows.length > 0) {
            const cols = Object.keys(rows[0]);
            let tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr>`;
            for (const col of cols) {
              tableHtml += `<th style="border:1px solid #ddd;padding:4px 8px;background:#f0f4f8;text-align:left;">${escapeHtml(col)}</th>`;
            }
            tableHtml += `</tr></thead><tbody>`;
            for (const row of rows) {
              tableHtml += `<tr>`;
              for (const col of cols) {
                tableHtml += `<td style="border:1px solid #ddd;padding:4px 8px;">${escapeHtml(String(row[col] || ""))}</td>`;
              }
              tableHtml += `</tr>`;
            }
            tableHtml += `</tbody></table>`;
            displayVal = tableHtml;
          }
        } else {
          displayVal = escapeHtml(val.join(", "));
        }
      } else if (typeof val === "object") {
        const entries = Object.entries(val as Record<string, unknown>);
        if (entries.length > 0) {
          let objHtml = `<table style="width:100%;border-collapse:collapse;font-size:12px;">`;
          for (const [k, v] of entries) {
            if (typeof v === "object" && v !== null) {
              const subEntries = Object.entries(v as Record<string, unknown>);
              objHtml += `<tr><td style="border:1px solid #ddd;padding:4px 8px;font-weight:600;">${escapeHtml(k)}</td>`;
              for (const [, sv] of subEntries) {
                objHtml += `<td style="border:1px solid #ddd;padding:4px 8px;">${escapeHtml(String(sv || ""))}</td>`;
              }
              objHtml += `</tr>`;
            } else {
              objHtml += `<tr><td style="border:1px solid #ddd;padding:4px 8px;font-weight:600;">${escapeHtml(k)}</td><td style="border:1px solid #ddd;padding:4px 8px;">${escapeHtml(String(v || ""))}</td></tr>`;
            }
          }
          objHtml += `</table>`;
          displayVal = objHtml;
        }
      } else if (typeof val === "boolean") {
        displayVal = val ? "Yes" : "No";
      } else {
        displayVal = escapeHtml(String(val));
      }
    }

    const isTableDisplay = displayVal.startsWith("<table");
    if (isTableDisplay) {
      fieldsHtml += `<tr><td colspan="2" style="padding:8px 14px;"><strong style="font-size:13px;color:#333;">${escapeHtml(field.label)}</strong><div style="margin-top:6px;">${displayVal}</div></td></tr>`;
    } else {
      fieldsHtml += `<tr><td style="padding:8px 14px;font-weight:600;font-size:13px;color:#333;width:35%;vertical-align:top;">${escapeHtml(field.label)}</td><td style="padding:8px 14px;font-size:13px;">${displayVal}</td></tr>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(formName)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#fff;">
  <div style="max-width:800px;margin:0 auto;padding:20px;">
    <div style="background:#3E5B84;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;font-size:20px;">D.I.S Infusion Centre</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Completed Form Submission</p>
    </div>
    <div style="background:#f0f4f8;padding:14px 24px;border-bottom:1px solid #ddd;">
      <h2 style="margin:0;font-size:16px;color:#1a3a5c;">${escapeHtml(formName)}</h2>
      <p style="margin:4px 0 0;font-size:12px;color:#666;">Submitted: ${now}</p>
    </div>
    <div style="padding:14px 24px;background:#fafbfc;border-bottom:1px solid #eee;">
      <table style="width:100%;font-size:13px;">
        <tr>
          <td style="padding:3px 0;"><strong>Patient:</strong> ${escapeHtml(respondent.first_name)} ${escapeHtml(respondent.last_name)}</td>
          <td style="padding:3px 0;"><strong>Email:</strong> ${escapeHtml(respondent.email)}</td>
        </tr>
        <tr>
          <td style="padding:3px 0;"><strong>ID Number:</strong> ${escapeHtml(respondent.id_number || "—")}</td>
          <td style="padding:3px 0;"><strong>Phone:</strong> ${escapeHtml(respondent.phone || "—")}</td>
        </tr>
      </table>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      ${fieldsHtml}
    </table>
    <div style="margin-top:20px;padding:12px 24px;background:#f5f5f5;border-radius:0 0 8px 8px;font-size:11px;color:#999;text-align:center;">
      This form was submitted digitally via the D.I.S Infusion Centre patient portal.
    </div>
  </div>
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

    const emailHtml = renderNotificationEmail(template.name, respondentInfo, patientId);

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
          subject: `Form Submission: ${template.name} — ${body.respondent_first_name} ${body.respondent_last_name}`,
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
        subject: `Form Submission: ${template.name} — ${body.respondent_first_name} ${body.respondent_last_name}`,
        content: `Form submitted by ${body.respondent_first_name} ${body.respondent_last_name} (${email})`,
        html: emailHtml,
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
