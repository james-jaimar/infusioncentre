

Looking at the current state: `usePatientDocuments.ts` exists and uploads to the `patient-documents` bucket — used by admin. Doctors currently can attach a document only at referral submission time (single `referral_document_path`). No way to add more later.

Need to check: doctor's view of patient — can they see existing docs? And the referral detail page for doctors — can they add more there?

## Plan: Doctor Document Uploads (Post-Referral)

### What's missing
- Doctor cannot upload additional documents after submitting a referral
- Doctor cannot upload documents to a patient record they referred
- Doctor cannot see what documents already exist on the patient

### Approach

Reuse the existing `patient-documents` storage bucket and `patient_documents` table (already used by admin). Add doctor-side UI + RLS policy so doctors can upload/view documents for patients they referred.

### Changes

**1. RLS policy update (migration)**
- Add policy on `patient_documents`: doctors can SELECT/INSERT documents where the patient has a referral linked to that doctor
- Add storage policy on `patient-documents` bucket: same scoping for doctors

**2. New tab on `DoctorReferralDetail.tsx`** — "Documents"
- List existing documents on the patient (from `usePatientDocuments`)
- Upload new document with type + notes (reuse `useUploadPatientDocument`)
- Tag uploads with `uploaded_by = doctor's user_id` so admin sees the source
- Need to resolve `patient_id` from referral — referrals link to patients via `patient_id` after triage; for pending referrals (no patient yet), allow upload that links to the referral itself via `referral_attachments` bucket

**3. New tab on `DoctorPatientView.tsx`** — "Documents"
- Same list + upload UI for the linked patient
- Read existing docs, add new ones

**4. Admin visibility**
- Admin's existing patient documents tab will automatically show doctor uploads (same table)
- Add a small "Uploaded by Dr. X" indicator if uploader is a doctor (nice-to-have)

### Edge case: pending referrals (no patient_id yet)
For referrals still in triage (no patient created), uploads go to the existing `referral-attachments` bucket and append to a `referral_additional_documents` jsonb column on the referral. Once converted to a patient, admin can promote them.

Simpler alternative: only allow extra doc uploads **after** the referral is matched/converted to a patient. Doctor sees a message "Documents can be added once the referral is reviewed" for pending referrals.

### Files

| Action | File |
|--------|------|
| Migration | RLS for `patient_documents` + storage policy |
| Modify | `src/pages/doctor/DoctorReferralDetail.tsx` — add Documents tab |
| Modify | `src/pages/doctor/DoctorPatientView.tsx` — add Documents tab |
| Create | `src/components/doctor/DoctorDocumentUpload.tsx` — reusable upload + list component |
| Modify | `src/hooks/usePatientDocuments.ts` — no change needed (already generic) |

No changes to admin side needed — they'll see the docs automatically.

