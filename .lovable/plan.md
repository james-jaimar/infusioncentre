
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

### Phase 1: Workflow Backbone — `IN PROGRESS`

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
- [ ] Audit event logging enhancement
  - Structured audit events for all status transitions

**Success Criteria:** A referral can be converted into a Treatment Course. Appointments belong to a Treatment Course. Status transitions are validated.

---

### Phase 2: Referral & Intake Excellence — `NOT STARTED`

Make referral processing fast, accurate, and trackable.

- [ ] Referral review queue with filters (status, urgency, date, doctor)
- [ ] Referral triage workflow (accept / request info / reject with reason)
- [ ] Referral → Treatment Course conversion wizard (guided multi-step)
- [ ] Document request workflow (request missing docs from doctor via email)
- [ ] Patient matching / duplicate detection on intake
- [ ] Doctor acknowledgement notifications (referral received, accepted, scheduled)
- [ ] Referral dashboard metrics (time-to-triage, conversion rate)

**Success Criteria:** A referral goes from submission to Treatment Course creation in < 5 clicks. Doctor is notified at each stage.

---

### Phase 3: Patient Onboarding Experience — `NOT STARTED`

Make patient preparation seamless and trackable.

- [ ] Task-driven patient dashboard (replace placeholder)
  - Shows: outstanding forms, upcoming appointments, preparation instructions, messages
- [ ] Dynamic onboarding packs (form sets triggered by Treatment Course type)
- [ ] Readiness scoring (% of required forms completed, medical aid verified, consent signed)
- [ ] In-clinic tablet mode for form completion (simplified UI, larger touch targets)
- [ ] Patient messaging (appointment reminders, preparation instructions, form nudges)
- [ ] Medical aid verification workflow
- [ ] Patient readiness visible on admin/nurse dashboards

**Success Criteria:** Admin can see at a glance which patients are "ready" for their appointment. Patient knows exactly what they need to do.

---

### Phase 4: Scheduling & Resource Operations — `NOT STARTED`

Sophisticated scheduling driven by Treatment Courses.

- [ ] Recurring session booking from Treatment Course (e.g., "6 sessions, weekly on Tuesday")
- [ ] Protocol-driven appointment defaults (duration, chair type, monitoring intervals from protocol)
- [ ] Extended chair states: available, occupied, cleaning, blocked, reserved, out_of_service
- [ ] Nurse allocation / workload balancing
- [ ] Delay / reassignment workflows (reschedule with reason, cascade updates)
- [ ] Calendar improvements (week/day view, drag-to-reschedule)
- [ ] Waitlist / cancellation backfill

**Success Criteria:** A Treatment Course auto-generates the right number of appointments with correct defaults. Chair utilization is visible.

---

### Phase 5: Clinical Treatment Engine — `NOT STARTED`

Protocol-driven clinical workflows.

- [ ] `treatment_protocols` table — configurable step sequences per treatment type
  - Steps: pre-assessment, consent check, IV access, medication prep, infusion start, monitoring intervals, post-assessment, discharge criteria
- [ ] Protocol-driven monitoring intervals (e.g., vitals every 15 min for first hour, then every 30 min)
- [ ] Assessment packs by protocol (which forms/checks at each phase)
- [ ] Discharge criteria engine (configurable rules: vitals in range, observation period elapsed, no reactions)
- [ ] Treatment summary auto-generation (structured summary of what happened during visit)
- [ ] Clinical alerts (overdue vitals, abnormal readings, reaction escalation)

**Success Criteria:** Nurse follows protocol steps guided by the system. Discharge is only possible when criteria are met. Treatment summary is auto-generated.

---

### Phase 6: Doctor Communication Loop — `NOT STARTED`

Keep referring doctors informed throughout the Treatment Course.

- [ ] Doctor report templates (configurable, per Treatment Course milestone)
- [ ] Milestone-triggered doctor updates (Treatment Course started, session X completed, course completed)
- [ ] Final Treatment Course summary report (auto-generated, editable, sendable)
- [ ] Sent / delivered / acknowledged tracking
- [ ] Doctor portal — report history view
- [ ] Doctor portal — patient progress view (read-only Treatment Course status)

**Success Criteria:** Doctor receives structured updates without admin effort. Final report is generated and sent when Treatment Course completes.

---

### Phase 7: Billing & Revenue Flow — `NOT STARTED`

From treatment items to invoice to payment.

- [ ] Invoice / claim generation (aggregate billable items per visit or per Treatment Course)
- [ ] Medical aid / payer mappings (which items are claimable, at what rates)
- [ ] Payment status tracking (submitted, paid, rejected, appealed)
- [ ] Billing exception queue (rejected claims, missing codes, price mismatches)
- [ ] Financial dashboards (revenue by period, outstanding claims, collection rate)
- [ ] Export to accounting (CSV/PDF for external systems)

**Success Criteria:** Treatment billing items flow into invoices. Claims can be tracked to payment. Revenue is visible.

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
