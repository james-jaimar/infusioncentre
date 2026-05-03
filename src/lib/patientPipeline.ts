// Single source of truth for "where is this patient in the operational pipeline?"
// Used by the patient list, the admin dashboard tile, and the patient detail panel.

export type PatientStage =
  | "needs_invite"
  | "invite_sent"
  | "onboarding"
  | "ready_to_schedule"
  | "scheduled"
  | "in_treatment"
  | "completed"
  | "paused"
  | "cancelled"
  | "no_course";

// Treatment-course statuses that count as "currently being worked on"
export const ACTIVE_COURSE_STATUSES = [
  "draft",
  "onboarding",
  "ready",
  "active",
  "completing",
] as const;

export const PAUSED_COURSE_STATUSES = ["paused"] as const;
export const TERMINAL_COURSE_STATUSES = ["completed", "cancelled"] as const;

export interface PipelineInputs {
  patient: { id: string; user_id?: string | null };
  courses: Array<{
    id: string;
    status: string;
    sessions_completed: number | null;
    total_sessions_planned: number | null;
  }>;
  invites?: Array<{ status: string; created_at: string; expires_at: string }>;
  checklistTotal?: number;
  checklistCompleted?: number;
  appointmentsScheduled?: number; // non-cancelled appointments
  appointmentsCompleted?: number;
}

export function derivePatientStage(input: PipelineInputs): PatientStage {
  const { patient, courses, invites, checklistTotal = 0, checklistCompleted = 0, appointmentsScheduled = 0, appointmentsCompleted = 0 } = input;

  const activeCourse = courses.find((c) => (ACTIVE_COURSE_STATUSES as readonly string[]).includes(c.status));
  const pausedCourse = courses.find((c) => (PAUSED_COURSE_STATUSES as readonly string[]).includes(c.status));
  const completedCourse = courses.find((c) => c.status === "completed");
  const cancelledOnly = courses.length > 0 && courses.every((c) => c.status === "cancelled");

  if (courses.length === 0) return "no_course";
  if (activeCourse) {
    // Treatment under way?
    if (appointmentsCompleted > 0 && (activeCourse.total_sessions_planned ?? 0) > appointmentsCompleted) {
      return "in_treatment";
    }
    // Needs portal access first
    if (!patient.user_id) {
      const pendingInvite = (invites || []).find((i) => i.status === "pending" && new Date(i.expires_at) > new Date());
      return pendingInvite ? "invite_sent" : "needs_invite";
    }
    // Has account — is onboarding done?
    if (checklistTotal > 0 && checklistCompleted < checklistTotal) return "onboarding";
    // Onboarding done — is anything scheduled?
    if (appointmentsScheduled === 0) return "ready_to_schedule";
    return "scheduled";
  }
  if (pausedCourse) return "paused";
  if (completedCourse) return "completed";
  if (cancelledOnly) return "cancelled";
  return "no_course";
}

export const STAGE_LABEL: Record<PatientStage, string> = {
  needs_invite: "Needs invite",
  invite_sent: "Invite sent",
  onboarding: "Onboarding",
  ready_to_schedule: "Ready to schedule",
  scheduled: "Scheduled",
  in_treatment: "In treatment",
  completed: "Completed",
  paused: "Paused",
  cancelled: "Cancelled",
  no_course: "No course yet",
};

// Tailwind classes for chip rendering (uses semantic tokens)
export const STAGE_CLASS: Record<PatientStage, string> = {
  needs_invite: "bg-clinical-warning-soft text-clinical-warning border-clinical-warning/40",
  invite_sent: "bg-clinical-info-soft text-clinical-info border-clinical-info/40",
  onboarding: "bg-clinical-warning-soft text-clinical-warning border-clinical-warning/40",
  ready_to_schedule: "bg-clinical-info-soft text-clinical-info border-clinical-info/40",
  scheduled: "bg-primary/10 text-primary border-primary/30",
  in_treatment: "bg-clinical-success-soft text-clinical-success border-clinical-success/40",
  completed: "bg-muted text-muted-foreground border-border",
  paused: "bg-clinical-warning-soft text-clinical-warning border-clinical-warning/40",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_course: "bg-muted text-muted-foreground border-border",
};

// Stages an admin actively needs to see/action
export const ACTIONABLE_STAGES: PatientStage[] = [
  "needs_invite",
  "invite_sent",
  "onboarding",
  "ready_to_schedule",
];

export function nextActionFor(stage: PatientStage): string | null {
  switch (stage) {
    case "needs_invite":
      return "Send portal invite";
    case "invite_sent":
      return "Invite is awaiting acceptance — resend or remind";
    case "onboarding":
      return "Chase outstanding onboarding forms";
    case "ready_to_schedule":
      return "Schedule first session";
    case "scheduled":
      return null;
    case "in_treatment":
      return null;
    case "paused":
      return "Course paused — review";
    default:
      return null;
  }
}