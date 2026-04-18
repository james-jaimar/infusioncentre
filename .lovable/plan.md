

## The workflow question

You're right — this is a tricky one. Right now once a doctor's referral becomes a patient at the clinic, **Gail owns that record**. The doctor can see the patient but can't touch anything. That's actually the safer default for a clinical CRM (single source of truth, no conflicting edits), but it's too restrictive for the doctor's actual needs.

### How clinics typically handle this

The doctor doesn't need to edit Gail's patient record directly. What they actually need is a way to **send updates/additional info** that Gail can then accept into the master record. Think of it like: the doctor *requests* a change, Gail *applies* it.

### Recommended approach: "Patient Update" notes from the doctor

Instead of giving the doctor edit rights to the patient table (risky, conflicts with Gail's authority), add **two narrow capabilities**:

**1. "Send Update to Clinic" button on the doctor's patient view**
- Opens a small dialog: free-text note + optional structured fields (new phone, new medical aid, new diagnosis/ICD-10, additional prescription notes)
- Posts a message into the existing `admin_doctor` thread with a clear `[Patient Update — Jane Doe]` prefix
- Gail sees it in her doctor messages tab and can manually update the patient record if she agrees

**2. "Submit Follow-up Referral"**
- For when the doctor wants to add a NEW treatment course / new prescription for an existing patient
- Pre-fills patient info, doctor only fills clinical bits
- Goes through the same triage flow as a brand-new referral, but linked to the existing patient

### Why this is better than direct edit

- Gail keeps single-source-of-truth ownership
- All doctor-initiated changes are auditable (sit in the message thread)
- No race conditions (doctor changes phone while Gail is mid-edit)
- Matches how real clinics work — the referring doctor never directly mutates the receiving clinic's chart

### What stays read-only for the doctor

- Patient demographics, contact, medical aid (they can *suggest* changes via the update button)
- Treatment courses, appointments, nurse notes, billing — all clinic-owned

### What the doctor CAN do (additions, not edits)

- Send patient updates (above)
- Submit follow-up referrals (above)
- Message admin about the patient (already works)
- View their own doctor reports for that patient (already works)

### Files to build

| Action | File |
|--------|------|
| Create | `src/components/doctor/PatientUpdateDialog.tsx` — update form, posts to messages |
| Create | `src/components/doctor/FollowUpReferralDialog.tsx` — pre-filled referral form |
| Modify | `src/pages/doctor/DoctorPatientView.tsx` — add two action buttons in header |
| Modify | `src/components/admin/PatientChatThread.tsx` (or doctor messages tab) — render `[Patient Update]` prefixed messages with a subtle highlight so Gail spots them |

No DB schema changes. Uses the existing `messages` table and existing referrals flow.

### Alternative if you really want direct edit

If you'd rather the doctor just edits the patient directly (faster, simpler, less ceremony), I can do that instead — but only on a narrow whitelist of fields (phone, email, address, medical aid). I'd **not** allow editing of name/DOB/ID number (identity fields) or any clinical/treatment data. Every edit would write to `audit_log` so Gail can see who changed what.

**Which would you prefer?**

