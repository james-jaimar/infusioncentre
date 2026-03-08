

# Update `.lovable/plan.md` — Full Development Roadmap

## What This Is

Rewrite `.lovable/plan.md` to serve as the single source of truth for the entire project. It will contain the development principles (already there), plus the full phased roadmap from the Master Workflow Map document, with completion status tracking for every phase and deliverable.

## File Changed

### `.lovable/plan.md` — Full rewrite

The new document will be structured as:

1. **Development Principles** — Keep existing "No Hard-Coding" doctrine, add the 5 design rules from the document (workflow-first, episode-based care, SaaS-ready, operational clarity, configuration-first)

2. **Domain Model** — List the canonical entities and clarify the chain: `Referral → Treatment Course → Appointment(s) → Visit → Treatment(s)`

3. **What's Built** — A checklist of completed features with tick marks so we always know what exists:
   - Role-based auth, Patient CRUD, Doctor referrals, Dynamic forms engine, Appointment scheduling, Command Centre, Job Card stepper, Vitals/IV/Medications/Reactions, Ketamine monitoring, Billable items, Email system, Communication log, Admin settings (chairs, appointment types), Patient onboarding checklists, Patient portal + invites, Session timeout

4. **Phased Build Roadmap** — Each phase with status (`NOT STARTED` / `IN PROGRESS` / `DONE`), deliverables as a checklist, and success criteria:

   - **Phase 0: Foundation Alignment** — `IN PROGRESS` — Master workflow map (done), domain glossary, lifecycle/state definitions, anti-hardcoding rules (done), admin config inventory
   - **Phase 1: Workflow Backbone** — `NOT STARTED` — `treatment_courses` table, status dictionaries, status transition rules, task/queue engine, audit event logging, referral→course→appointment linking
   - **Phase 2: Referral & Intake Excellence** — `NOT STARTED` — Referral review queue, conversion wizard, document request workflow, patient matching, doctor acknowledgements
   - **Phase 3: Patient Onboarding Experience** — `NOT STARTED` — Task-driven patient dashboard, dynamic onboarding packs, readiness scoring, tablet mode, patient messaging
   - **Phase 4: Scheduling & Resource Operations** — `NOT STARTED` — Recurring booking, protocol-driven defaults, chair states (cleaning/blocked/reserved/out_of_service), nurse allocation, delay/reassignment
   - **Phase 5: Clinical Treatment Engine** — `NOT STARTED` — Configurable protocol steps, monitoring interval engine, assessment packs, discharge criteria engine, treatment summary generation
   - **Phase 6: Doctor Communication Loop** — `NOT STARTED` — Report templates, milestone-triggered updates, final summary workflow, sent/acknowledged tracking, doctor portal history
   - **Phase 7: Billing & Revenue Flow** — `NOT STARTED` — Invoice/claim generation, payer mappings, payment status dashboards, billing exception queue
   - **Phase 8: Admin Configuration Console** — `NOT STARTED` — Workflow config UI, protocol config UI, forms pack config UI, dictionary/status management UI, report template management, pricing config UI
   - **Phase 9: SaaS Hardening** — `NOT STARTED` — Tenant isolation, tenant-scoped config, branding engine, subscription model

5. **State Machines to Formalize** — Reference list of the 8 state machines (referral, onboarding, treatment course, appointment, visit, treatment, billing, doctor report) with their recommended statuses from the document

6. **Work Queues** — The admin, nurse, clinician, doctor, and patient queues from the document

7. **Current Sprint** — A section that tracks what we're actively working on, updated as we go. Initially: "Phase 0 completion → Phase 1 start"

This gives us a living document where each phase can be checked off, and the "Current Sprint" section always tells us where we are.

