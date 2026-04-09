import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import SignatureCanvas from "@/components/forms/SignatureCanvas";

interface FacsimileProps {
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  readOnly?: boolean;
}

function Field({ name, values, onChange, readOnly, className = "", placeholder = "" }: {
  name: string; values: Record<string, any>; onChange: (v: Record<string, any>) => void;
  readOnly?: boolean; className?: string; placeholder?: string;
}) {
  return (
    <Input
      value={values[name] || ""}
      onChange={(e) => onChange({ ...values, [name]: e.target.value })}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`border-0 border-b border-border rounded-none h-7 text-xs px-1 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${className}`}
    />
  );
}

function Tick({ name, label, values, onChange, readOnly }: {
  name: string; label: string; values: Record<string, any>;
  onChange: (v: Record<string, any>) => void; readOnly?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <Checkbox
        checked={!!values[name]}
        onCheckedChange={(c) => onChange({ ...values, [name]: !!c })}
        disabled={readOnly}
        className="h-4 w-4"
      />
      <span className="text-xs">{label}</span>
    </label>
  );
}

function Sig({ name, label, values, onChange, readOnly }: {
  name: string; label: string; values: Record<string, any>;
  onChange: (v: Record<string, any>) => void; readOnly?: boolean;
}) {
  return (
    <SignatureCanvas
      label={label}
      value={values[name] || ""}
      onChange={(v) => onChange({ ...values, [name]: v })}
      readOnly={readOnly}
      compact
    />
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="flex items-stretch border-b-2 border-foreground">
      <div className="flex-1 flex items-center gap-4 px-4 py-3">
        <span className="text-2xl font-bold italic tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
          MonoFer<sup className="text-xs">®</sup>
        </span>
        <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
          CosmoFer<sup className="text-xs">®</sup>
        </span>
      </div>
      <div className="border-l-2 border-foreground px-4 py-3 flex items-center">
        <span className="text-xl font-extrabold tracking-wide uppercase">{title}</span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wide py-1.5 px-2 bg-muted/40">{children}</h3>;
}

function FormRow({ label, name, label2, name2, values, onChange, readOnly }: {
  label: string; name: string; label2?: string; name2?: string;
  values: Record<string, any>; onChange: (v: Record<string, any>) => void; readOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 border-b border-border">
      <div className="flex items-center border-r border-border">
        <span className="text-xs text-muted-foreground w-32 shrink-0 px-2 py-1 bg-muted/20 border-r border-border self-stretch flex items-center">{label}</span>
        <Field name={name} values={values} onChange={onChange} readOnly={readOnly} className="flex-1" />
      </div>
      {label2 && name2 ? (
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground w-32 shrink-0 px-2 py-1 bg-muted/20 border-r border-border self-stretch flex items-center">{label2}</span>
          <Field name={name2} values={values} onChange={onChange} readOnly={readOnly} className="flex-1" />
        </div>
      ) : <div />}
    </div>
  );
}

/* ═══════════════════════ PAGE 1: CONSENT ═══════════════════════ */

function ConsentPage({ values, onChange, readOnly }: FacsimileProps) {
  return (
    <div className="border border-foreground bg-card">
      <PageHeader title="Consent Agreement" />

      <div className="px-4 pt-3">
        <h4 className="text-xs font-bold uppercase mb-2">Patient Consent and Privacy Note Form</h4>

        <div className="border border-border p-3 text-[11px] leading-relaxed text-muted-foreground space-y-2 mb-3">
          <p>Acino Pharma (Pty) Ltd ("Acino") continually searches for innovative ways to provide unsurpassed support to patients and Healthcare Professionals. As part of this continued innovation, Acino has engaged Nurse Educators and an Administrator to assist patients and Healthcare Professionals by liaising with Medical Aid on their behalf ("Services").</p>
          <p>In the light of the above, please indicate whether or not you would like to receive the service by ticking the appropriate box below:</p>
          <div className="flex items-center gap-8 py-1">
            <Tick name="consent_yes" label="YES to the Service" values={values} onChange={onChange} readOnly={readOnly} />
            <Tick name="consent_no" label="NO to the Service" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
          <p className="text-[10px]">If yes, please read and complete the Consent Form below, together with the attached Privacy Note on the Processing of Personal Information, marked Annexure "A" ("Privacy Note") and then sign the Consent Form below.</p>
        </div>

        <h4 className="text-xs font-bold uppercase mb-2">Patient Consent</h4>
        <div className="text-[11px] leading-relaxed space-y-2 text-muted-foreground mb-3">
          <div className="flex flex-wrap items-end gap-1">
            <span>I,</span>
            <Field name="patient_full_name" values={values} onChange={onChange} readOnly={readOnly} className="w-64 inline-flex" placeholder="Patient full name" />
            <span>("Patient") or where the Patient is a minor, the Patient's lawful guardian, ID No.</span>
            <Field name="patient_id_number" values={values} onChange={onChange} readOnly={readOnly} className="w-40 inline-flex" placeholder="ID number" />
          </div>
          <div className="flex flex-wrap items-end gap-1">
            <span>hereby voluntarily consent to the disclosure of my Personal Information by Dr</span>
            <Field name="hcp_name" values={values} onChange={onChange} readOnly={readOnly} className="w-40 inline-flex" placeholder="Doctor name" />
            <span>("HCP") to Acino's Medical Affairs Personnel, Nurse Educator, agents, contractors, and/or representatives ("Acino"), for the sole purpose of Acino providing the Service to me ("Purpose").</span>
          </div>
          <p className="text-[10px]">For the purpose of this Consent, Confidential/Personal Information shall mean, but not limited to, the Patient's name, Identity Number, Age, Gender, Contact details, Address, Physical or Mental health, well-being, disability, Clinical information and the Patient's medical record relating to the disease.</p>
          <p className="text-[10px]">I understand and have been provided with a Privacy Note which provides a more complete description on the use, processing and disclosure of my Personal Information. I understand that I have the right to review the said explanatory note prior to signing this consent. I understand that I may revoke this consent at any time, without any consequences to me.</p>
          <p className="text-[10px]">I have read this Consent Form and the attached Privacy Note, both of whose contents have been explained to me. I hereby freely and voluntarily agree to being provided with the Service and for the Purpose as described above and will receive a copy of this Consent Form.</p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
          <div>
            <span className="text-[10px] text-muted-foreground">Patient's / Guardian's Signature:</span>
            <div className="border border-border rounded min-h-[140px] mt-1">
              <Sig name="patient_signature" label="Patient Signature" values={values} onChange={onChange} readOnly={readOnly} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Date:</span>
            <Field name="patient_consent_date" values={values} onChange={onChange} readOnly={readOnly} placeholder="DD/MM/YYYY" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Patient's Contact Number:</span>
            <Field name="patient_contact" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Next of Kin's Contact Number:</span>
            <Field name="nok_contact" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
        </div>

        <SectionTitle>Nurse Educator Details</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-2 mb-3">
          <div><span className="text-[10px] text-muted-foreground">Nurse Educator Name:</span><Field name="nurse_name" values={values} onChange={onChange} readOnly={readOnly} /></div>
          <div>
            <span className="text-[10px] text-muted-foreground">Signature:</span>
            <div className="border border-border rounded min-h-[140px] mt-1">
              <Sig name="nurse_signature" label="Nurse Signature" values={values} onChange={onChange} readOnly={readOnly} />
            </div>
          </div>
          <div><span className="text-[10px] text-muted-foreground">Phone:</span><Field name="nurse_phone" values={values} onChange={onChange} readOnly={readOnly} /></div>
          <div><span className="text-[10px] text-muted-foreground">Fax:</span><Field name="nurse_fax" values={values} onChange={onChange} readOnly={readOnly} /></div>
          <div><span className="text-[10px] text-muted-foreground">Mobile:</span><Field name="nurse_mobile" values={values} onChange={onChange} readOnly={readOnly} /></div>
          <div><span className="text-[10px] text-muted-foreground">Email:</span><Field name="nurse_email" values={values} onChange={onChange} readOnly={readOnly} /></div>
        </div>

        <SectionTitle>Healthcare Professional's Consent</SectionTitle>
        <div className="text-[11px] leading-relaxed text-muted-foreground py-2 space-y-2 mb-3">
          <div className="flex flex-wrap items-end gap-1">
            <span>I, Dr</span>
            <Field name="hcp_consent_name" values={values} onChange={onChange} readOnly={readOnly} className="w-52 inline-flex" />
            <span>Practice No</span>
            <Field name="hcp_practice_no" values={values} onChange={onChange} readOnly={readOnly} className="w-40 inline-flex" />
          </div>
          <p className="text-[10px]">Hereby, in accordance with the Patient's consent above, consent to Acino utilising the Patient's Confidential/Personal Information for the Purpose.</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <span className="text-[10px]">Healthcare Professional's Signature:</span>
              <div className="border border-border rounded min-h-[140px] mt-1">
                <Sig name="hcp_signature" label="HCP Signature" values={values} onChange={onChange} readOnly={readOnly} />
              </div>
            </div>
            <div><span className="text-[10px]">Date:</span><Field name="hcp_consent_date" values={values} onChange={onChange} readOnly={readOnly} placeholder="DD/MM/YYYY" /></div>
            <div><span className="text-[10px]">Doctor's Contact Number:</span><Field name="hcp_contact" values={values} onChange={onChange} readOnly={readOnly} /></div>
          </div>
        </div>

        <SectionTitle>Undertaking by Acino</SectionTitle>
        <p className="text-[10px] text-muted-foreground py-2 leading-relaxed">Acino warrants and undertakes that it has the skill to provide the Services and that Acino shall at all times use its best endeavours to use, process and keep the Patient's Confidential/Personal Information confidential in accordance with the provisions of the Protection of Personal Information Act No.4 of 2013 and shall use/process same only for the Purpose in this Consent.</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-2 mb-3">
          <div><span className="text-[10px] text-muted-foreground">Nurse Educator's Name:</span><Field name="acino_nurse_name" values={values} onChange={onChange} readOnly={readOnly} /></div>
          <div><span className="text-[10px] text-muted-foreground">Date:</span><Field name="acino_date" values={values} onChange={onChange} readOnly={readOnly} placeholder="DD/MM/YYYY" /></div>
          <div className="col-span-2">
            <span className="text-[10px] text-muted-foreground">Signature:</span>
            <div className="border border-border rounded min-h-[140px] mt-1 max-w-sm">
              <Sig name="acino_signature" label="Acino Signature" values={values} onChange={onChange} readOnly={readOnly} />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-2 pb-3 text-[9px] text-muted-foreground space-y-0.5">
          <p>S3 CosmoFer®. Each 1,0 ml contains iron (III)-hydroxide dextran complex equivalent to 50 mg iron (III). Reg. No. 37/8.3/0434.</p>
          <p>S3 Monofer® 500 mg each 5 ml vial/ampoule contains 500 mg iron as ferric derisomaltose. Reg. No. 46/8.3/0167.</p>
          <p>S3 Monofer® 1 000 mg each 10 ml vial/ampoule contains 1 000 mg iron as ferric derisomaltose. Reg. No. 46/8.3/0168.</p>
          <p>HCR: Acino Pharma (Pty) Ltd. Reg. no.: 1994/008717/07. No 106, 16th Road, Midrand, 1686, Gauteng, South Africa. 087 742-1660.</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ PAGE 2: MOTIVATION ═══════════════════════ */

function MotivationPage({ values, onChange, readOnly }: FacsimileProps) {
  return (
    <div className="border border-foreground bg-card">
      <PageHeader title="Motivation" />

      <SectionTitle>Prescribing Practitioner</SectionTitle>
      <div className="border-b border-border">
        <FormRow label="Name & Surname" name="dr_name" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Name of Facility" name="dr_facility" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Speciality" name="dr_speciality" label2="Fax" name2="dr_fax" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Address" name="dr_address" label2="Tel" name2="dr_tel" values={values} onChange={onChange} readOnly={readOnly} />
        <div className="grid grid-cols-2 border-b border-border">
          <div className="border-r border-border" />
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground w-32 shrink-0 px-2 py-1 bg-muted/20 border-r border-border">Email</span>
            <Field name="dr_email" values={values} onChange={onChange} readOnly={readOnly} className="flex-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-border">
          <div className="border-r border-border" />
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground w-32 shrink-0 px-2 py-1 bg-muted/20 border-r border-border">Practice No.</span>
            <Field name="dr_practice_no" values={values} onChange={onChange} readOnly={readOnly} className="flex-1" />
          </div>
        </div>
      </div>

      <SectionTitle>Infusion Facility</SectionTitle>
      <div className="border-b border-border">
        <FormRow label="Name of Facility" name="facility_name" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Address" name="facility_address" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Tel" name="facility_tel" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Email" name="facility_email" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Practice No." name="facility_practice_no" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Hospital PR No." name="facility_pr_no" label2="Treatment Date" name2="facility_treatment_date" values={values} onChange={onChange} readOnly={readOnly} />
      </div>

      <SectionTitle>Patient Details</SectionTitle>
      <div className="border-b border-border">
        <FormRow label="Name" name="pt_name" label2="Physical Address" name2="pt_address" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Surname" name="pt_surname" label2="Initials" name2="pt_initials" values={values} onChange={onChange} readOnly={readOnly} />
        <div className="grid grid-cols-2 border-b border-border">
          <div className="flex items-center border-r border-border">
            <span className="text-xs text-muted-foreground w-32 shrink-0 px-2 py-1 bg-muted/20 border-r border-border self-stretch flex items-center">Date of birth</span>
            <Field name="pt_dob" values={values} onChange={onChange} readOnly={readOnly} className="flex-1" placeholder="DD/MM/YYYY" />
          </div>
          <div className="flex items-center gap-4 px-3">
            <Tick name="pt_gender_m" label="M" values={values} onChange={onChange} readOnly={readOnly} />
            <Tick name="pt_gender_f" label="F" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
        </div>
        <FormRow label="ID Number" name="pt_id" label2="Email Address" name2="pt_email" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Medical Aid" name="pt_medical_aid" label2="Treatment Date" name2="pt_treatment_date" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Membership No." name="pt_membership" label2="Hospital Pr No." name2="pt_hospital_pr" values={values} onChange={onChange} readOnly={readOnly} />
        <FormRow label="Body Weight" name="pt_weight" label2="Gestational Age" name2="pt_gestational_age" values={values} onChange={onChange} readOnly={readOnly} />
      </div>

      <SectionTitle>Prescription</SectionTitle>
      <div className="border-b border-border">
        <div className="grid grid-cols-2 border-b border-border">
          <div className="px-3 py-1.5 font-bold text-xs border-r border-border">Monofer®</div>
          <div className="px-3 py-1.5 font-bold text-xs">CosmoFer®</div>
        </div>
        <div className="grid grid-cols-2 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-1 border-r border-border">
            <Tick name="rx_monofer_1000" label="NAPPI 722193001 (Monofer 1000 mg / 10 ml vial)" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <Tick name="rx_cosmofer_500" label="NAPPI 713080001 (Cosmofer 500 mg / 10 ml)" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-1 border-r border-border">
            <Tick name="rx_monofer_500" label="NAPPI 722192001 (Monofer 500 mg / 5 ml vial)" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <Tick name="rx_cosmofer_100" label="NAPPI 711596002 (Cosmofer 100 mg / 2 ml)" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground px-3 py-1.5">Kindly approve reimbursement for the following indication/s for CosmoFer® or Monofer®</p>

      <SectionTitle>Prior Treatment Including Oral</SectionTitle>
      <div className="grid grid-cols-3 gap-x-4 px-3 py-2 border-b border-border">
        <div><span className="text-[10px] text-muted-foreground">Medication:</span><Field name="prior_medication" values={values} onChange={onChange} readOnly={readOnly} /></div>
        <div><span className="text-[10px] text-muted-foreground">Dosage:</span><Field name="prior_dosage" values={values} onChange={onChange} readOnly={readOnly} /></div>
        <div><span className="text-[10px] text-muted-foreground">Duration:</span><Field name="prior_duration" values={values} onChange={onChange} readOnly={readOnly} /></div>
      </div>

      <SectionTitle>Clinical Diagnosis</SectionTitle>
      <div className="px-3 py-2 border-b border-border">
        <textarea
          value={values.clinical_diagnosis || ""}
          onChange={(e) => onChange({ ...values, clinical_diagnosis: e.target.value })}
          readOnly={readOnly}
          rows={2}
          className="w-full border border-border rounded px-2 py-1 text-xs bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <SectionTitle>ICD 10 Codes</SectionTitle>
      <div className="border-b border-border">
        <div className="grid grid-cols-2">
          <div className="border-r border-border">
            {[
              { code: "D 50.8", desc: "Other iron deficiency anaemias", name: "icd_d508" },
              { code: "N 18.0 - N 18.9", desc: "End stage renal failure", name: "icd_n18" },
              { code: "D 63.8", desc: "Anaemia in other chronic diseases, classifies elsewhere", name: "icd_d638" },
              { code: "O 99.0", desc: "Anaemia complicating pregnancy, childbirth and the puerperium", name: "icd_o990" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2 px-2 py-1 border-b border-border last:border-b-0">
                <Checkbox checked={!!values[item.name]} onCheckedChange={(c) => onChange({ ...values, [item.name]: !!c })} disabled={readOnly} className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-medium w-28 shrink-0">{item.code}</span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
          <div>
            {[
              { code: "D 50.9", desc: "Iron deficiency anaemia - unspecified", name: "icd_d509" },
              { code: "E 61.1", desc: "Pure iron deficiency", name: "icd_e611" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2 px-2 py-1 border-b border-border last:border-b-0">
                <Checkbox checked={!!values[item.name]} onCheckedChange={(c) => onChange({ ...values, [item.name]: !!c })} disabled={readOnly} className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-medium w-28 shrink-0">{item.code}</span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-2 py-1 border-b border-border">
              <span className="text-[11px] font-medium w-28 shrink-0">Other</span>
              <Field name="icd_other" values={values} onChange={onChange} readOnly={readOnly} className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-3 py-2 border-b border-border">
        <span className="text-xs font-bold">Procedure Codes</span>
        {["0201", "0206", "5783"].map((code) => (
          <label key={code} className="flex items-center gap-1.5">
            <span className="text-xs font-bold">{code}</span>
            <Checkbox checked={!!values[`proc_${code}`]} onCheckedChange={(c) => onChange({ ...values, [`proc_${code}`]: !!c })} disabled={readOnly} className="h-4 w-4" />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-6 px-3 py-3 border-b border-border">
        <div>
          <span className="text-[10px] text-muted-foreground">Dr's Signature:</span>
          <div className="border border-border rounded min-h-[140px] mt-1">
            <Sig name="dr_motivation_signature" label="Dr Signature" values={values} onChange={onChange} readOnly={readOnly} />
          </div>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground">Date:</span>
          <Field name="dr_motivation_date" values={values} onChange={onChange} readOnly={readOnly} placeholder="DD/MM/YYYY" />
        </div>
      </div>

      <div className="bg-muted/30 border-b border-border px-3 py-2 text-center">
        <p className="text-xs font-bold">IMPORTANT: Please Attach Copies of Latest HB & Iron Studies (not more than 3 months old)</p>
      </div>

      <div className="px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>Email to: auth_za@acino.swiss</span>
        <span>Tel: 087 742 1892</span>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN EXPORT ═══════════════════════ */

export default function MonoferMotivationForm({ values, onChange, readOnly }: FacsimileProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <ConsentPage values={values} onChange={onChange} readOnly={readOnly} />
      <MotivationPage values={values} onChange={onChange} readOnly={readOnly} />
    </div>
  );
}
