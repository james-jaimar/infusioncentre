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

// ─── Facsimile field labels grouped by section ───

const FACSIMILE_SECTIONS: { title: string; fields: Record<string, string> }[] = [
  {
    title: "Patient Consent",
    fields: {
      consent_yes: "Consents to Service (YES)",
      consent_no: "Consents to Service (NO)",
      patient_full_name: "Patient Full Name",
      patient_id_number: "Patient ID Number",
      hcp_name: "Disclosing Doctor Name",
      patient_signature: "Patient / Guardian Signature",
      patient_consent_date: "Patient Consent Date",
      patient_contact: "Patient Contact Number",
      nok_contact: "Next of Kin Contact Number",
    },
  },
  {
    title: "Nurse Educator Details",
    fields: {
      nurse_name: "Nurse Educator Name",
      nurse_signature: "Nurse Signature",
      nurse_phone: "Phone",
      nurse_fax: "Fax",
      nurse_mobile: "Mobile",
      nurse_email: "Email",
    },
  },
  {
    title: "Healthcare Professional's Consent",
    fields: {
      hcp_consent_name: "HCP Name",
      hcp_practice_no: "Practice Number",
      hcp_signature: "HCP Signature",
      hcp_consent_date: "HCP Consent Date",
      hcp_contact: "Doctor Contact Number",
    },
  },
  {
    title: "Undertaking by Acino",
    fields: {
      acino_nurse_name: "Nurse Educator Name",
      acino_date: "Date",
      acino_signature: "Acino Signature",
    },
  },
  {
    title: "Prescribing Practitioner",
    fields: {
      dr_name: "Name & Surname",
      dr_facility: "Name of Facility",
      dr_speciality: "Speciality",
      dr_fax: "Fax",
      dr_address: "Address",
      dr_tel: "Tel",
      dr_email: "Email",
      dr_practice_no: "Practice No.",
    },
  },
  {
    title: "Infusion Facility",
    fields: {
      facility_name: "Name of Facility",
      facility_address: "Address",
      facility_tel: "Tel",
      facility_email: "Email",
      facility_practice_no: "Practice No.",
      facility_pr_no: "Hospital PR No.",
      facility_treatment_date: "Treatment Date",
    },
  },
  {
    title: "Patient Details",
    fields: {
      pt_name: "Name",
      pt_address: "Physical Address",
      pt_surname: "Surname",
      pt_initials: "Initials",
      pt_dob: "Date of Birth",
      pt_gender_m: "Gender — Male",
      pt_gender_f: "Gender — Female",
      pt_id: "ID Number",
      pt_email: "Email Address",
      pt_medical_aid: "Medical Aid",
      pt_treatment_date: "Treatment Date",
      pt_membership: "Membership No.",
      pt_hospital_pr: "Hospital Pr No.",
      pt_weight: "Body Weight",
      pt_gestational_age: "Gestational Age",
    },
  },
  {
    title: "Prescription",
    fields: {
      rx_monofer_1000: "Monofer 1000 mg / 10 ml vial (NAPPI 722193001)",
      rx_monofer_500: "Monofer 500 mg / 5 ml vial (NAPPI 722192001)",
      rx_cosmofer_500: "CosmoFer 500 mg / 10 ml (NAPPI 713080001)",
      rx_cosmofer_100: "CosmoFer 100 mg / 2 ml (NAPPI 711596002)",
    },
  },
  {
    title: "Prior Treatment Including Oral",
    fields: {
      prior_medication: "Medication",
      prior_dosage: "Dosage",
      prior_duration: "Duration",
    },
  },
  {
    title: "Clinical Diagnosis",
    fields: {
      clinical_diagnosis: "Clinical Diagnosis",
    },
  },
  {
    title: "ICD 10 Codes",
    fields: {
      icd_d508: "D 50.8 — Other iron deficiency anaemias",
      icd_n18: "N 18.0–N 18.9 — End stage renal failure",
      icd_d638: "D 63.8 — Anaemia in other chronic diseases",
      icd_o990: "O 99.0 — Anaemia complicating pregnancy",
      icd_d509: "D 50.9 — Iron deficiency anaemia, unspecified",
      icd_e611: "E 61.1 — Pure iron deficiency",
      icd_other: "Other ICD Code",
    },
  },
  {
    title: "Procedure Codes",
    fields: {
      proc_0201: "0201",
      proc_0206: "0206",
      proc_5783: "5783",
    },
  },
  {
    title: "Doctor Motivation",
    fields: {
      dr_motivation_signature: "Doctor's Signature",
      dr_motivation_date: "Date",
    },
  },
];

function renderFacsimileToHtml(
  formName: string,
  data: Record<string, unknown>,
  respondent: { first_name: string; last_name: string; email: string; id_number?: string; phone?: string },
): string {
  const now = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

  let sectionsHtml = "";

  for (const section of FACSIMILE_SECTIONS) {
    const rows: string[] = [];

    for (const [key, label] of Object.entries(section.fields)) {
      const val = data[key];
      if (val === undefined || val === null || val === "" || val === false) continue;

      // Signature — render as image
      if (key.includes("signature") && typeof val === "string" && val.startsWith("data:")) {
        rows.push(`<tr><td style="padding:8px 14px;font-weight:600;font-size:13px;color:#333;width:35%;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 14px;"><img src="${val}" style="max-height:80px;border:1px solid #ddd;border-radius:4px;" /></td></tr>`);
        continue;
      }

      // Boolean / checkbox
      if (typeof val === "boolean") {
        rows.push(`<tr><td style="padding:8px 14px;font-weight:600;font-size:13px;color:#333;width:35%;">${escapeHtml(label)}</td><td style="padding:8px 14px;font-size:13px;">Yes</td></tr>`);
        continue;
      }

      rows.push(`<tr><td style="padding:8px 14px;font-weight:600;font-size:13px;color:#333;width:35%;">${escapeHtml(label)}</td><td style="padding:8px 14px;font-size:13px;">${escapeHtml(String(val))}</td></tr>`);
    }

    if (rows.length === 0) continue;

    sectionsHtml += `<tr><td colspan="2" style="background:#e8eff7;padding:10px 14px;font-weight:bold;font-size:14px;color:#1a3a5c;border-bottom:2px solid #3E5B84;">${escapeHtml(section.title)}</td></tr>`;
    sectionsHtml += rows.join("");
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
      ${sectionsHtml}
    </table>
    <div style="margin-top:20px;padding:12px 24px;background:#f5f5f5;border-radius:0 0 8px 8px;font-size:11px;color:#999;text-align:center;">
      This form was submitted digitally via the D.I.S Infusion Centre patient portal.
    </div>
  </div>
</body>
</html>`;
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

    if (!body.slug || !body.respondent_first_name || !body.respondent_last_name || !body.respondent_email || !body.data) {
      return new Response(
        JSON.stringify({ error: "slug, respondent_first_name, respondent_last_name, respondent_email, and data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // 4. Generate email HTML — use facsimile renderer when appropriate
    const respondentInfo = {
      first_name: body.respondent_first_name,
      last_name: body.respondent_last_name,
      email,
      id_number: body.respondent_id_number,
      phone: body.respondent_phone,
    };

    let emailHtml: string;
    if (template.render_mode === "facsimile") {
      emailHtml = renderFacsimileToHtml(
        template.name,
        body.data as Record<string, unknown>,
        respondentInfo,
      );
    } else {
      emailHtml = renderFormToPdfHtml(
        template.name,
        template.form_schema as any[],
        body.data as Record<string, unknown>,
        respondentInfo,
        body.signature_data,
      );
    }

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
