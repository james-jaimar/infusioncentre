
# Gail Infusion Centre — Development Roadmap

> This is the single source of truth for the project. Update status markers as work progresses.

---

## Development Principles

### 1. No Hard-Coding — Admin-Configurable First

> **Default to admin-configurable, never hard-code.**
>
> 1. First consider whether it should be an **admin setting**, **lookup table**, or **configurable parameter** rather than a hard-coded value.
> 2. If the user hasn't explicitly said "make this configurable," proactively suggest: *"This should probably be an admin setting — shall I add it to the Settings page?"*
> 3. Hard-coding is only acceptable for true constants (e.g., mathematical values, framework config) — not business logic, labels, thresholds, durations, messages, or clinical parameters.

### 2. Workflow-First Architecture

Every feature must answer: *What triggers it? What status does it change? What queue does it appear in? Who gets notified?*

### 3. Episode-Based Care Model

The system models episodes of care (Treatment Courses), not isolated appointments. A referral produces a Treatment Course, which contains multiple sessions (appointments), each of which produces a visit with treatments, vitals, and billing.

### 4. SaaS-Ready from Day One

All entities carry `tenant_id` readiness. No global assumptions. Config is tenant-scoped. Branding is injectable.

### 5. Operational Clarity

Nurses, doctors, and admins each see exactly what they need — no more, no less. Complexity lives in architecture; simplicity lives in UX.

### 6. Configuration-First

Protocols, status transitions, form packs, monitoring intervals, discharge criteria, billing rules — all driven by admin-configurable data, not code.

---

## Domain Model

```
Referral → Treatment Course → Appointment(s) → Visit → Treatment(s)
                                                  ├── Vitals
                                                  ├── IV Access
                                                  ├── Medications
                                                  ├── Reactions
                                                  ├── Assessments
                                                  ├── Ketamine Monitoring
                                                  └── Billing Items
```

### Canonical Entities

| Entity | Purpose |
|---|---|
| **Referral** | Doctor's request for treatment. Contains diagnosis, urgency, prescription. |
| **Treatment Course** | Episode of care. Links referral to a series of sessions. Tracks protocol, progress, overall status. |
| **Appointment** | A single scheduled session within a Treatment Course. Chair + time + nurse. |
| **Visit** | The in-clinic encounter for an appointment. Check-in → discharge. |
| **Treatment** | Clinical actions during a visit. Medications administered, vitals recorded, assessments completed. |
| **Patient** | The person receiving care. Demographics, medical history, documents, portal access. |
| **Doctor** | Referring clinician. Submits referrals, receives reports. |
| **Billable Item** | SKU-level item (drug, consumable, procedure, fee). |
| **Form Template** | Dynamic form definition (consent, questionnaire, assessment). |

---

## What's Built ✅

- [x] Role-based auth (Admin, Nurse, Doctor, Patient) — Supabase Auth + user_roles + RLS
- [x] Patient CRUD + medical history + documents
- [x] Doctor referral submission portal
- [x] Dynamic forms engine (JSONB schema, 14+ field types, AI PDF import)
- [x] Appointment scheduling + calendar + chair lane assignment
- [x] Nurse Command Centre (12-col grid, chair panels, live timers)
- [x] Treatment Job Card (stepper: pre-assessment → in-progress → discharge)
- [x] Vitals recording (pre/during/post phases)
- [x] IV access tracking (insertion, site checks, removal)
- [x] Medication administration logging
- [x] Reaction recording + severity grading
- [x] Ketamine-specific monitoring (dissociation, alertness, mood, pain)
- [x] Billable items catalogue (SKU codes, tariff/ICD-10, stock tracking)
- [x] Treatment billing capture (per-treatment item recording)
- [x] Email system + templates (SMTP edge function, variable substitution)
- [x] Communication log + audit trail
- [x] Admin settings (chairs, appointment types — CRUD with display order)
- [x] Patient onboarding checklists (per-treatment-type form requirements)
- [x] Patient portal + invite system (token-based)
- [x] Session timeout + security (30-min inactivity, 2-min warning)
- [x] Public website (services, training courses, contact form, booking)

---

## Phased Build Roadmap

### Phase 0: Foundation Alignment — `IN PROGRESS`

Establish the architectural foundation before building features.

- [x] Master workflow map document reviewed
- [x] Development principles documented
- [x] Anti-hardcoding doctrine established
- [ ] Domain glossary finalized (this document)
- [ ] Lifecycle / state machine definitions written (see State Machines below)
- [ ] Admin config inventory — audit all hard-coded values in codebase

**Success Criteria:** Every entity has a defined lifecycle. No ambiguity about what "status" means for any record.

---

### Phase 1: Workflow Backbone — `DONE`

The structural foundation everything else depends on.

- [x] `treatment_courses` table — links referral to episode of care
  - Fields: id, referral_id, patient_id, doctor_id, treatment_type_id, status, total_sessions_planned, sessions_completed, started_at, expected_end_date, completed_at, notes, created_by
- [x] `treatment_course_status` enum (draft, onboarding, ready, active, paused, completing, completed, cancelled)
- [x] `appointments.treatment_course_id` FK added
- [x] RLS policies (admin full, nurse read/update, doctor own patients, patient own)
- [x] `useTreatmentCourses` hook (CRUD + convert referral)
- [x] Admin Treatment Courses page with list view + status filter
- [x] Convert Referral → Treatment Course dialog
- [x] Status dictionaries — configurable lookup tables for all entity statuses
  - `status_dictionaries` table: entity_type, status_key, display_label, display_order, color, is_terminal, is_default
  - Seeded for: referral, treatment_course, appointment, treatment
- [x] Status transition rules — valid state transitions per entity
  - `status_transitions` table: entity_type, from_status, to_status, required_role, auto_trigger, label
  - Seeded for all entity types with full lifecycle transitions
- [x] Admin UI for status management (Settings → Status Management tab)
- [x] `useStatusDictionaries` hook with transition validation helpers
- [x] Audit event logging enhancement
  - DB trigger `log_status_change()` on treatment_courses, referrals, appointments, treatments
  - Automatically writes structured events to `audit_log` on every status change

**Success Criteria:** A referral can be converted into a Treatment Course. Appointments belong to a Treatment Course. Status transitions are validated. ✅

---

### Phase 2: Referral & Intake Excellence — `DONE`

Make referral processing fast, accurate, and trackable.

- [x] Referral review queue with filters (status, urgency, date, doctor) + patient name search
- [x] Referral triage workflow (accept / request info / reject with reason) — uses status dictionaries & transitions
- [x] Referral → Treatment Course conversion wizard (guided multi-step via ConvertReferralDialog)
- [x] Document request workflow (request missing docs from doctor via email, sets info_requested status)
- [x] Patient matching / duplicate detection on intake (PatientMatcher component with fuzzy search)
- [x] Doctor acknowledgement notifications (email sent on every status transition via send-email edge function)
- [x] Referral dashboard metrics (pending count, urgent count, accepted count, avg triage time)
- [x] Referral status enum extended: under_review, info_requested, rejected, converted_to_course
- [x] Refactored AdminReferrals into focused components: ReferralMetrics, ReferralFilters, ReferralTable, ReferralTriageDialog, PatientMatcher

**Success Criteria:** A referral goes from submission to Treatment Course creation in < 5 clicks. Doctor is notified at each stage. ✅

---

### Phase 3: Patient Onboarding Experience — `DONE`

Make patient preparation seamless and trackable.

- [x] Task-driven patient dashboard (replace placeholder)
  - Shows: outstanding forms with progress bar, upcoming appointments with prep instructions, completion celebration
  - Refactored into: OnboardingProgress, UpcomingAppointments components
- [x] Dynamic onboarding packs (form sets triggered by Treatment Course type)
  - DB trigger `auto_generate_onboarding_checklist()` on treatment_courses INSERT
  - Automatically creates checklist items based on treatment type + universal templates
  - Auto-transitions course status from draft → onboarding
- [x] Readiness scoring (% of required forms completed, visual progress bar)
  - `useOnboardingReadiness` hook with completion percentage
  - Progress bar on patient dashboard
- [x] Patient readiness visible on admin/nurse dashboards
  - `PatientReadinessBadge` component (shared) with tooltip showing form completion
  - Added to: Admin PatientDetail header, Nurse Today's Patients list
- [ ] In-clinic tablet mode for form completion (simplified UI, larger touch targets)
- [ ] Patient messaging (appointment reminders, preparation instructions, form nudges)
- [ ] Medical aid verification workflow

**Success Criteria:** Admin can see at a glance which patients are "ready" for their appointment. Patient knows exactly what they need to do.

---

### Phase 4: Scheduling & Resource Operations — `DONE`

Sophisticated scheduling driven by Treatment Courses.

- [x] Recurring session booking from Treatment Course (e.g., "6 sessions, weekly on Tuesday")
  - RecurringSessionDialog with frequency options (weekly, biweekly, twice-weekly, monthly)
  - Preview of generated dates, bulk appointment creation linked to treatment_course_id
  - Session numbering tracked via `appointments.session_number`
- [ ] Protocol-driven appointment defaults (duration, chair type, monitoring intervals from protocol)
- [x] Extended chair states: available, occupied, cleaning, blocked, reserved, out_of_service
  - `chair_status` enum + column on `treatment_chairs`
  - Command Centre ChairPanel renders state-specific UI (icons, colors, labels)
- [x] Nurse allocation / workload balancing
  - `useNurseWorkload` hook counts appointments per nurse per day
  - Nurse selector sorted by workload, shows appointment counts
- [x] Delay / reassignment workflows (reschedule with reason, cascade updates)
  - RescheduleDialog: marks original as `rescheduled`, creates new linked appointment
  - `reschedule_reason` and `rescheduled_from_id` columns on appointments
  - `rescheduled` status added to appointment_status enum
- [x] Calendar improvements (week/day view already existed, rescheduling via dialog)
- [ ] Waitlist / cancellation backfill

**Success Criteria:** A Treatment Course auto-generates the right number of appointments with correct defaults. Chair utilization is visible. ✅

---

### Phase 5: Clinical Treatment Engine — `DONE`

Protocol-driven clinical workflows.

- [x] `treatment_protocols` table — configurable step sequences per treatment type
  - Per-treatment-type protocols with monitoring intervals, observation periods, min vitals counts
  - `treatment_protocol_steps` table for ordered step sequences
  - Seeded protocols for all 5 treatment types (Iron, Ketamine, IV Vitamin, Biologics, Blood Transfusion)
- [x] Protocol-driven monitoring intervals (e.g., vitals every 15 min for first hour, then every 30 min)
  - `ProtocolMonitoringBanner` component shows live countdown to next vitals
  - Interval changes based on elapsed time (initial vs standard period)
- [x] Assessment packs by protocol (which forms/checks at each phase)
  - `discharge_criteria` table with configurable rules per protocol
  - Vitals thresholds, observation periods, reaction checks, IV site verification
- [x] Discharge criteria engine (configurable rules: vitals in range, observation period elapsed, no reactions)
  - `evaluateDischargeReadiness()` auto-evaluates all criteria against current treatment state
  - Manual override checkboxes for criteria that can't be auto-evaluated
  - Protocol-specific criteria (e.g., Ketamine requires dissociation resolution)
- [x] Treatment summary auto-generation (structured summary of what happened during visit)
  - `treatment_summaries` table with structured data + narrative markdown
  - Auto-generated on discharge: duration, vitals count, medications, reactions, criteria met
  - `generateNarrativeSummary()` creates human-readable treatment report
- [x] Clinical alerts (overdue vitals, abnormal readings, reaction escalation)
  - `clinical_alerts` table with severity levels (info/warning/critical) and status tracking
  - `vitals_thresholds` table with configurable normal ranges (global + per-protocol)
  - `ClinicalAlerts` component auto-evaluates vitals against thresholds on each recording
  - Overdue vitals detection with protocol-aware intervals
  - Acknowledge + resolve workflow for alerts

**Success Criteria:** Nurse follows protocol steps guided by the system. Discharge is only possible when criteria are met. Treatment summary is auto-generated. ✅

---

### Phase 6: Doctor Communication Loop — `DONE`

Keep referring doctors informed throughout the Treatment Course.

- [x] Doctor report templates (configurable, per Treatment Course milestone)
  - `doctor_report_templates` table with milestone triggers (course_started, session_completed, course_completed, manual)
  - Variable substitution engine ({{patient_name}}, {{doctor_name}}, {{treatment_type}}, etc.)
  - Admin CRUD UI for templates (Settings → Doctor Reports → Templates tab)
  - Seeded 3 default templates: Course Started, Session Progress, Course Completion Summary
- [x] Milestone-triggered doctor updates (Treatment Course started, session X completed, course completed)
  - `doctor_reports` table with full lifecycle tracking (pending → generating → review → sent → acknowledged)
  - `useGenerateReport` hook: fetches template, substitutes variables, creates report in "review" status
  - Admin report queue with status filters and preview
- [x] Final Treatment Course summary report (auto-generated, editable, sendable)
  - Course Completion template with treatment summary, duration, session count
  - Preview dialog with HTML rendering, edit capability before sending
- [x] Sent / delivered / acknowledged tracking
  - `doctor_report_status` enum: pending, generating, review, sent, acknowledged
  - `sent_at` and `acknowledged_at` timestamps
  - Audit trigger on status changes via `log_status_change`
  - Email delivery tracked via communication_log (send-email edge function integration)
- [x] Doctor portal — report history view
  - `/doctor/reports` page with table view, preview dialog, acknowledge button
  - Unread reports count on Doctor Dashboard
- [x] Doctor portal — patient progress view (read-only Treatment Course status)
  - `/doctor/courses/:courseId` page with progress bar, session timeline, course details
  - Treatment Courses listed on Doctor Dashboard with progress indicators

**Success Criteria:** Doctor receives structured updates without admin effort. Final report is generated and sent when Treatment Course completes. ✅

---

### Phase 7: Billing & Revenue Flow — `DONE`

From treatment items to invoice to payment.

- [x] Invoice / claim generation (aggregate billable items per visit or per Treatment Course)
  - `invoices` table with auto-generated invoice numbers (INV-YYYYMM-NNNN)
  - `invoice_line_items` table linking to billable_items and treatment_billable_items
  - `useGenerateInvoiceFromCourse` hook: aggregates all billable items across a course's treatments into a single invoice
  - Computed `amount_outstanding` column (total - paid)
- [x] Medical aid / payer mappings (which items are claimable, at what rates)
  - `payer_rate_mappings` table: payer + billable item → contracted rate, effective dates, claimable flag
  - Admin CRUD UI for rate mappings (Billing → Payer Rates tab)
- [x] Payment status tracking (submitted, paid, rejected, appealed)
  - `billing_claims` table with full lifecycle: draft → submitted → accepted → paid (or rejected → appealed → written_off)
  - `invoice_status` enum: draft, finalized, submitted, partially_paid, paid, void
  - Submit Claim action from invoice (auto-creates claim + updates invoice status)
  - Audit triggers on both invoices and claims
- [x] Billing exception queue (rejected claims, missing codes, price mismatches)
  - Claims tab with status filters — rejected claims surfaced with rejection reasons/codes
  - Financial summary card showing rejected claim count
- [x] Financial dashboards (revenue by period, outstanding claims, collection rate)
  - `useFinancialSummary` hook: totalInvoiced, totalCollected, totalOutstanding, collectionRate
  - Dashboard cards with collection rate progress bar
  - Admin Billing page with 4 summary cards + invoices/claims/rates tabs
- [x] Export to accounting (CSV/PDF for external systems)
  - CSV export of invoices (invoice #, patient, status, total, paid, outstanding, date)

**Success Criteria:** Treatment billing items flow into invoices. Claims can be tracked to payment. Revenue is visible. ✅

---

### Phase 8: Admin Configuration Console — `NOT STARTED`

Full self-service admin for all configurable aspects.

- [ ] Workflow config UI (status dictionaries, transition rules, prerequisites)
- [ ] Protocol config UI (treatment protocols, step sequences, monitoring intervals)
- [ ] Form pack config UI (which forms required for which Treatment Course types)
- [ ] Dictionary / status management UI (CRUD for all lookup tables)
- [ ] Report template management (doctor report templates)
- [ ] Pricing config UI (billable item pricing, medical aid rate mappings)
- [ ] Feature flags UI (enable/disable WhatsApp, Ketamine monitoring, etc.)
- [ ] Clinic settings (business hours, contact details, branding basics)

**Success Criteria:** Admin can configure any business rule without developer involvement.

---

### Phase 9: SaaS Hardening — `NOT STARTED`

Prepare for multi-tenant deployment.

- [ ] `tenant_id` on all tables + RLS policies
- [ ] Tenant-scoped configuration (each tenant has own protocols, templates, settings)
- [ ] Branding engine (logo, colors, clinic name per tenant)
- [ ] Subscription model + usage metering
- [ ] Tenant onboarding wizard
- [ ] Data isolation audit

**Success Criteria:** Two clinics can run on the same instance without seeing each other's data.

---

## State Machines

### 1. Referral Lifecycle
```
pending → under_review → accepted → converted_to_course
                       → info_requested → under_review
                       → rejected
                       → cancelled
```

### 2. Treatment Course Lifecycle
```
draft → onboarding → ready → active → completing → completed
                                     → paused → active
                                     → cancelled
```

### 3. Appointment Lifecycle
```
scheduled → confirmed → checked_in → in_progress → completed
                                                  → cancelled
                                                  → no_show
           → rescheduled → scheduled
```

### 4. Visit Lifecycle
```
checked_in → pre_assessment → treatment_active → post_assessment → discharge_ready → discharged
                                               → escalated → treatment_active
                                                            → emergency_transfer
```

### 5. Treatment Lifecycle
```
pending → pre_assessment → in_progress → post_assessment → completed
                                       → paused → in_progress
                                       → cancelled
```

### 6. Patient Onboarding Lifecycle
```
invited → registered → forms_pending → forms_complete → verified → ready
                                                       → needs_review → verified
```

### 7. Billing Claim Lifecycle
```
draft → submitted → accepted → paid
                  → rejected → appealed → accepted
                                        → written_off
                  → partially_paid → paid
```

### 8. Doctor Report Lifecycle
```
pending → generating → review → sent → acknowledged
                     → edit → review
```

---

## Work Queues

### Admin Queue
- Pending referrals awaiting triage
- Patients with incomplete onboarding
- Appointments needing chair/nurse assignment
- Billing exceptions
- Expiring medical aid authorizations

### Nurse Queue
- Today's checked-in patients
- Active treatments requiring vitals
- Overdue monitoring alerts
- Discharge-ready patients
- Upcoming sessions (next 2 hours)

### Doctor Queue
- Referral status updates
- Reports awaiting acknowledgement
- Patient progress summaries

### Patient Queue
- Outstanding forms to complete
- Upcoming appointment details + preparation instructions
- Messages from clinic

---

## Current Sprint

**Status:** Phase 0 completion → Phase 1 start

### Active Work
- [x] Master workflow map reviewed and gap analysis complete
- [x] Development roadmap documented (this file)
- [ ] Audit codebase for hard-coded values needing migration to admin settings
- [ ] Design `treatment_courses` table schema (detailed column spec + constraints)
- [ ] Design `status_dictionaries` + `status_transitions` tables
- [ ] Write Phase 1 migration SQL

### Next Up
- Phase 1 implementation: Treatment Courses + status dictionaries + referral conversion

---

## Command Centre — Reference Image Rebuild

### Approach

Adapt the user-provided reference component code to work with the existing HSL-based design system tokens (`clinical-success`, `clinical-warning`, etc.) rather than adding conflicting RGB tokens. The existing `index.css` and `tailwind.config.ts` already have all needed color tokens.

### Token Mapping (no file changes needed)

| Reference Token | Existing Token |
|---|---|
| `ok` / `oksoft` | `clinical-success` / `clinical-success-soft` |
| `warn` / `warnsoft` | `clinical-warning` / `clinical-warning-soft` |
| `danger` / `dangersoft` | `clinical-danger` / `clinical-danger-soft` |
| `info` / `infosoft` | `clinical-info` / `clinical-info-soft` |
| `surface` | `card` (white) |
| `surface2` | `muted` |
| `muted` (text) | `muted-foreground` |
| `text` | `foreground` |
| `primary` | `primary` |

### Key Visual Details

- Cards use `rounded-xl` (16px) with `shadow-md`
- Left accent stripe via `before:` pseudo-element: `before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl`
- State tint backgrounds use gradients: `bg-gradient-to-b from-[state-soft]/70 to-card/80`
- Progress bar is a custom div (not shadcn Progress) with state-colored fill and rounded corners
- Entire layout fits on a single tablet screen without scrolling
