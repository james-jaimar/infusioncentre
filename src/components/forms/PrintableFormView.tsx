import type { FormField } from "./FormRenderer";

interface PatientInfo {
  name: string;
  email?: string;
  idNumber?: string;
  phone?: string;
}

interface PrintableFormViewProps {
  title: string;
  schema: FormField[];
  values: Record<string, any>;
  patientInfo: PatientInfo;
  submittedAt: string;
  signatureData?: string;
}

function formatValue(val: any): string {
  if (val === undefined || val === null || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) {
    if (val.length === 0) return "—";
    if (typeof val[0] === "object") {
      return JSON.stringify(val, null, 2);
    }
    return val.join(", ");
  }
  if (typeof val === "object") {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }
  return String(val);
}

export function openPrintableForm(props: PrintableFormViewProps) {
  const w = window.open("", "_blank", "width=800,height=1000");
  if (!w) return;

  const now = new Date(props.submittedAt).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group fields by section
  type Section = { title: string; fields: { label: string; value: string; isSignature: boolean }[] };
  const sections: Section[] = [];
  let currentSection: Section = { title: "General", fields: [] };

  for (const field of props.schema) {
    if (field.field_type === "section_header") {
      if (currentSection.fields.length > 0) sections.push(currentSection);
      currentSection = { title: field.label, fields: [] };
      continue;
    }
    if (field.field_type === "info_text") continue;

    const val = props.values[field.field_name];
    if (val === undefined || val === null || val === "" || val === false) continue;

    const isSignature = field.field_type === "signature" && typeof val === "string" && val.startsWith("data:");

    currentSection.fields.push({
      label: field.label,
      value: isSignature ? val : formatValue(val),
      isSignature,
    });
  }
  if (currentSection.fields.length > 0) sections.push(currentSection);

  // Also handle top-level signature_data
  if (props.signatureData) {
    sections.push({
      title: "Signature",
      fields: [{ label: "Patient Signature", value: props.signatureData, isSignature: true }],
    });
  }

  const sectionsHtml = sections
    .map(
      (s) => `
      <div class="section">
        <div class="section-title">${s.title}</div>
        <table>
          ${s.fields
            .map(
              (f) => `
            <tr>
              <td class="label">${f.label}</td>
              <td class="value">${
                f.isSignature
                  ? `<img src="${f.value}" style="max-height:70px;border:1px solid #ccc;" />`
                  : f.value
              }</td>
            </tr>`
            )
            .join("")}
        </table>
      </div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${props.title} — Print</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      background: #fff;
      padding: 20mm 15mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1F3A5F;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .clinic-name {
      font-size: 20px;
      font-weight: bold;
      color: #1F3A5F;
    }
    .clinic-sub {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }
    .form-title {
      font-size: 16px;
      font-weight: bold;
      color: #1F3A5F;
      margin-bottom: 4px;
    }
    .meta { font-size: 11px; color: #666; }
    .patient-block {
      background: #f5f7fa;
      border: 1px solid #dde3ea;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 24px;
      font-size: 12px;
    }
    .patient-block strong { color: #333; }
    .section { margin-bottom: 14px; page-break-inside: avoid; }
    .section-title {
      background: #e8eff7;
      padding: 6px 12px;
      font-weight: bold;
      font-size: 12px;
      color: #1F3A5F;
      border-left: 3px solid #1F3A5F;
      margin-bottom: 0;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 5px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
    td.label { font-weight: 600; width: 35%; color: #333; font-size: 11px; }
    td.value { font-size: 12px; color: #1a1a1a; }
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body { padding: 10mm; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">Johannesburg Infusion Centre</div>
      <div class="clinic-sub">Patient Form Submission</div>
    </div>
    <div style="text-align:right;">
      <div class="form-title">${props.title}</div>
      <div class="meta">Submitted: ${now}</div>
    </div>
  </div>

  <div class="patient-block">
    <div><strong>Patient:</strong> ${props.patientInfo.name}</div>
    <div><strong>Email:</strong> ${props.patientInfo.email || "—"}</div>
    <div><strong>ID Number:</strong> ${props.patientInfo.idNumber || "—"}</div>
    <div><strong>Phone:</strong> ${props.patientInfo.phone || "—"}</div>
  </div>

  ${sectionsHtml}

  <div class="footer">
    This form was submitted digitally via the Johannesburg Infusion Centre patient portal.
  </div>
</body>
</html>`;

  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}
