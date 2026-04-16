

## Plan: Fix Referral Workflow — Admin + Doctor Sides

### Issues identified

1. **Admin: Doctor name shows "—"** — The doctor's `practice_name` is null in DB. The display should fall back to the doctor's profile name (first_name + last_name from profiles table), or at minimum show the email.

2. **Admin: Actions tab appears empty or non-functional** — The status transitions data exists and should work for `under_review` status. However, `ConvertReferralDialog` is broken: it ignores the referral being converted and instead shows a dropdown to pick from pending/accepted referrals. It needs to accept the selected referral + patient_id as props.

3. **Doctor: Referral rows not clickable** — No detail page exists at `/doctor/referrals/:id`. Doctor can't view or interact with their referral after submission.

4. **Doctor: Patient view is a skeleton** — `DoctorPatientView` only shows treatment history. No notes, no doctor reports, no messaging.

### Changes

**1. Fix doctor name display (admin referral table + triage dialog)**
- Update `useReferrals` query to also join `profiles` via `doctors.user_id` to get first/last name as fallback
- Update `ReferralTable` and `ReferralTriageDialog` to display `profiles.first_name + last_name` when `practice_name` is null

**2. Fix ConvertReferralDialog**
- Add `referralId`, `patientId`, `doctorId`, `patientName`, `treatmentRequested` props
- Pre-populate the form with the passed referral data instead of showing a dropdown
- Remove the referral selector when a referral is already provided

**3. Create Doctor Referral Detail page**
- New file: `src/pages/doctor/DoctorReferralDetail.tsx`
- Tabbed view:
  - **Details** — Read-only referral info (patient, diagnosis, treatment, prescription, ICD-10, medical aid, attachments)
  - **Status & Updates** — Timeline showing status changes, admin notes (read-only from doctor's perspective)
  - **Messages** — Chat thread with admin about this specific referral (reuse ChatThread/ChatInput with `conversation_type: 'admin_doctor'` filtered to doctor_id)
- New route: `/doctor/referrals/:referralId` in App.tsx
- Update `DoctorReferrals.tsx` to make table rows clickable → navigate to detail page
- Add status filter values for `under_review`, `info_requested`, `rejected` (currently missing from the Select)

**4. Enhance DoctorPatientView**
- Add tabs: **Overview** (current info + medical aid), **Treatment Courses** (existing, improved), **Reports** (doctor_reports for this patient, read-only), **Notes** (read-only clinical notes from admin/nurse)
- Keep everything read-only as designed

**5. Fix referral name resolution in useReferrals**
- The join `doctors(practice_name, email, specialisation)` works, but we also need profile names. Add a secondary query or modify the join to include a name fallback.

### Files

| Action | File |
|--------|------|
| Create | `src/pages/doctor/DoctorReferralDetail.tsx` |
| Modify | `src/App.tsx` — add route |
| Modify | `src/pages/doctor/DoctorReferrals.tsx` — clickable rows, more status filters |
| Modify | `src/pages/doctor/DoctorPatientView.tsx` — tabbed detail view |
| Modify | `src/components/admin/ConvertReferralDialog.tsx` — accept referral props |
| Modify | `src/pages/admin/AdminReferrals.tsx` — pass referral data to ConvertReferralDialog |
| Modify | `src/hooks/useReferrals.ts` — join profiles for doctor name fallback |
| Modify | `src/components/admin/referrals/ReferralTable.tsx` — use fallback name |
| Modify | `src/components/admin/referrals/ReferralTriageDialog.tsx` — use fallback name |

No database changes needed.

