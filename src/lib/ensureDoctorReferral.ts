import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure a referral row links the given patient to the given doctor.
 * Idempotent: if a referral already exists for (patient_id, doctor_id) we do nothing.
 * Used when an admin picks a "referring doctor" on an appointment — the patient
 * should then appear under that doctor's Patients/Referrals as if they had
 * been referred in the first place.
 */
export async function ensureDoctorReferral(
  patientId: string,
  doctorId: string,
): Promise<{ created: boolean; referralId?: string } | null> {
  try {
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("patient_id", patientId)
      .eq("doctor_id", doctorId)
      .maybeSingle();
    if (existing?.id) return { created: false, referralId: existing.id };

    const { data: patient } = await supabase
      .from("patients")
      .select("first_name, last_name, email, phone, tenant_id")
      .eq("id", patientId)
      .maybeSingle();
    if (!patient) return null;

    const { data: authUser } = await supabase.auth.getUser();
    const reviewerId = authUser?.user?.id ?? null;

    const insertPayload: any = {
      doctor_id: doctorId,
      patient_id: patientId,
      patient_first_name: patient.first_name,
      patient_last_name: patient.last_name,
      patient_email: patient.email ?? null,
      patient_phone: patient.phone ?? null,
      status: "accepted",
      urgency: "routine",
      reason_for_referral: "Admin-created via appointment scheduling",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    };
    if (patient.tenant_id) insertPayload.tenant_id = patient.tenant_id;

    const { data: created, error } = await supabase
      .from("referrals")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) {
      console.error("ensureDoctorReferral insert failed", error);
      return null;
    }
    return { created: true, referralId: created.id };
  } catch (e) {
    console.error("ensureDoctorReferral error", e);
    return null;
  }
}