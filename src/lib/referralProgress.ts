export type ReferralAttention =
  | "awaiting_triage"
  | "needs_patient"
  | "needs_course"
  | "complete";

export interface ReferralLike {
  status?: string | null;
  patient_id?: string | null;
}

/**
 * Derive what the admin still needs to do for a referral.
 * - awaiting_triage: status === "pending"
 * - needs_patient:   accepted/under_review but no patient linked yet
 * - needs_course:    accepted, patient linked, but no treatment course created
 * - complete:        accepted with at least one course, or terminal status
 */
export function getReferralAttention(
  ref: ReferralLike,
  courseCount: number
): ReferralAttention {
  const status = ref.status || "";
  if (status === "pending") return "awaiting_triage";

  // Terminal / non-actionable statuses
  if (
    status === "rejected" ||
    status === "cancelled" ||
    status === "completed" ||
    status === "converted_to_course"
  ) {
    return "complete";
  }

  if (status === "accepted" || status === "under_review" || status === "info_requested" || status === "scheduled") {
    if (!ref.patient_id) return "needs_patient";
    if (courseCount <= 0) return "needs_course";
    return "complete";
  }

  return "complete";
}

export const ATTENTION_LABEL: Record<ReferralAttention, string> = {
  awaiting_triage: "Awaiting triage",
  needs_patient: "Needs patient",
  needs_course: "Needs course setup",
  complete: "Complete",
};

export const ATTENTION_SHORT: Record<ReferralAttention, string> = {
  awaiting_triage: "to triage",
  needs_patient: "needs patient",
  needs_course: "needs course",
  complete: "complete",
};

export function isAttentionNeeded(a: ReferralAttention): boolean {
  return a !== "complete";
}