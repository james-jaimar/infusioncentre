

## Plan: End-to-End Workflow Wiring + In-App Messaging

This plan connects the full clinical workflow — from doctor referral through to treatment — and adds a WhatsApp-style messaging system so Gail can communicate with doctors and patients in-app.

### What exists today

| Area | Status |
|------|--------|
| Doctor referral form | Done (with attachments, ICD-10, medical aid, drafts) |
| Admin referral triage | Done (review, status transitions, email to doctor) |
| Patient Matcher on triage | Done (fuzzy match existing patients) |
| Convert referral → Treatment Course | Done |
| Treatment Course management | Done (list, schedule recurring sessions) |
| Patient creation (manual) | Done |
| Patient portal (onboarding forms) | Done |
| Patient portal (appointments, records, profile) | Stubs only |
| Appointment scheduling + calendar | Done |
| Nurse command centre + job card | Done |
| In-app messaging | Does not exist |
| Auto-create patient from referral | Does not exist |

### What's missing (in workflow order)

```text
Doctor Referral ──→ [GAP: auto-create patient] ──→ Treatment Course
                                                        │
Patient Portal ──→ [GAP: records, profile pages]        │
       │                                                 │
       └── [GAP: messaging] ←── Admin/Gail ──→ [GAP: messaging] ──→ Doctor
                                                        │
                                              Scheduling (exists)
                                                        │
                                              Nurse workflow (exists)
```

---

### Phase 1: Auto-Create Patient from Referral (wiring the biggest gap)

When admin accepts a referral and no existing patient is matched, the system should **auto-create a patient record** from the referral data (name, email, phone, medical aid) and link it back to the referral.

**Database**: No new tables needed — uses existing `patients` table.

**Changes**:
- `src/components/admin/referrals/ReferralTriageDialog.tsx` — Add a "Create New Patient" button on the Patient Match tab that pre-fills from referral data, creates the patient, and links it
- `src/hooks/useReferrals.ts` — Add `useCreatePatientFromReferral` mutation that inserts into `patients`, then updates `referral.patient_id`
- Update the Convert-to-Course flow to require a linked patient (it already does, but the UX for creating one mid-triage is missing)

---

### Phase 2: In-App Messaging System (WhatsApp-style)

New `messages` table + real-time chat UI that Gail uses to communicate with doctors and patients, threaded per-patient.

**Database migration** — new table:
```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default '00000000-0000-0000-0000-000000000001',
  conversation_type text not null check (conversation_type in ('admin_patient', 'admin_doctor')),
  patient_id uuid references patients(id),
  doctor_id uuid references doctors(id),
  sender_id uuid not null,
  sender_role text not null,
  content text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS
-- Admins: full access within tenant
-- Doctors: read/write own conversations
-- Patients: read/write own conversations

-- Enable Realtime
alter publication supabase_realtime add table messages;
```

**New files**:
- `src/hooks/useMessages.ts` — query messages by patient/doctor, send message mutation, real-time subscription via Supabase channels
- `src/components/messaging/ChatThread.tsx` — WhatsApp-style bubble UI (sender on right, recipient on left), auto-scroll, timestamp grouping
- `src/components/messaging/ChatInput.tsx` — text input with send button
- `src/components/messaging/ConversationList.tsx` — sidebar list of active conversations with unread badges

**Integration points**:
- **Admin PatientDetail** — new "Messages" tab showing the chat thread with that patient
- **Admin page** — new `/admin/messages` route showing all conversations (patients + doctors)
- **Patient portal** — new `/patient/messages` route replacing the "Contact Us" card
- **Doctor portal** — new `/doctor/messages` route for per-patient messaging with the clinic
- **Email notifications** — when a new message is sent, fire the `send-email` Edge Function to notify the recipient ("You have a new message from the Infusion Centre — log in to view")

---

### Phase 3: Patient Portal Buildout

Replace the three "Coming Soon" stubs.

**`/patient/appointments`** — show upcoming + past appointments from the `appointments` table (RLS already allows patient access). Show status, date, treatment type, prep instructions.

**`/patient/records`** — show completed form submissions, treatment history (from `treatments` table via `appointments`), and downloadable documents from `patient_documents`.

**`/patient/profile`** — editable profile form (name, phone, address, emergency contact, medical aid). Read from `patients` table, write back with validation. Medical history (allergies, conditions) as read-only summary.

**New files**:
- `src/pages/patient/PatientAppointments.tsx`
- `src/pages/patient/PatientRecords.tsx`
- `src/pages/patient/PatientProfile.tsx`
- `src/pages/patient/PatientMessages.tsx`

**Update** `src/App.tsx` to wire the new routes.

---

### Phase 4: Doctor Portal Messaging + Patient View

- `src/pages/doctor/DoctorMessages.tsx` — conversation list filtered to the doctor's patients, with chat thread
- Update `src/pages/doctor/DoctorPatientView.tsx` — add a Messages tab so the doctor can message the clinic about a specific patient
- Update `src/components/layout/DoctorLayout.tsx` — add Messages nav item with unread count badge

---

### Implementation Order

| Step | What | Why this order |
|------|------|----------------|
| 1 | Auto-create patient from referral | Closes the biggest workflow gap; everything downstream needs a patient record |
| 2 | Messages table + hook + ChatThread component | Foundation for all messaging |
| 3 | Admin messages page + PatientDetail messages tab | Gail can start messaging immediately |
| 4 | Patient portal pages (appointments, records, profile) | Patients need a functional portal before messaging makes sense |
| 5 | Patient messaging page | Patients can now chat with Gail |
| 6 | Doctor messaging page | Doctors can chat with Gail per-patient |
| 7 | Email notifications for new messages | Ensures nobody misses a message |

### Files touched (summary)

- 1 new migration (messages table + RLS + realtime)
- ~8 new component/page files
- ~4 existing files updated (App.tsx, PatientDetail, DoctorLayout, ReferralTriageDialog)
- 1 new hook (useMessages)
- 1 updated hook (useReferrals — add patient creation)

This is a large scope. I recommend we tackle it in the order above, one step at a time, so we can test each piece before moving on.

