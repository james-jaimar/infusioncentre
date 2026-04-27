## Goal

Empower the nurse to facilitate patient form completion in-clinic — either filling out a form *with* the patient on the nurse's tablet, or handing over a tablet for the patient to self-complete — directly from the Job Card and Today's Schedule. This unblocks treatments when patients arrive with missing onboarding forms.

## What the nurse will be able to do

1. **See exactly what's missing** on the Job Card sidebar — the existing Onboarding card already lists pending forms but they're not actionable.
2. **Tap a pending form** → choose one of two flows:
   - **"Complete with patient"** — opens the form full-screen, signed by the patient, submitted by the nurse.
   - **"Hand to patient"** — launches a **Patient Kiosk Mode**: locks the tablet to that single form, hides nurse navigation, requires patient signature, and returns to the Job Card on submit (or after timeout / nurse PIN to exit early).
3. **Resume** any in-progress draft the patient started elsewhere.
4. **See readiness on Today's Schedule** — a small "⚠ 2 forms outstanding" chip on each appointment row, with a quick "Help with forms" action that jumps straight into the same flow without opening the full Job Card.

## Technical changes

### New components
- `src/components/nurse/JobCardOnboarding.tsx` — replaces the read-only Onboarding card in `JobCardSidebar.tsx`. Lists each required form with status pill + actions (`Complete with patient` / `Hand to patient` / `View`).
- `src/components/nurse/PatientKioskMode.tsx` — full-screen overlay wrapping `FullScreenFormDialog` with:
  - Hidden nurse chrome (no sidebar, no back-to-job-card button).
  - Header showing patient name only ("Hi James, please complete this form").
  - Exit guarded by a 4-digit nurse PIN (stored per-session in memory, set on first kiosk launch).
  - Submission attributed to the patient's `user_id` if linked; else `submitted_by = nurse user_id` with a flag in `data.completed_with_nurse_assistance = true`.

### Modified files
- `src/components/nurse/JobCardSidebar.tsx` — swap the static onboarding block for the new `JobCardOnboarding`.
- `src/pages/nurse/NurseJobCard.tsx` — wire in kiosk launching; on form-submit invalidate the readiness query so the "Start Treatment" button unlocks immediately.
- `src/components/nurse/command-centre/TodaysSchedule.tsx` — add a forms-readiness chip per row using `useOnboardingReadiness`, plus a "Help with forms" quick action that opens the kiosk picker without navigating away.
- `src/hooks/useFormSubmissions.ts` — extend `useCreateFormSubmission` to accept the assistance flag and include it in `data`.

### Permissions / data
No schema changes required. Existing RLS already allows:
- Nurses to insert/update `form_submissions` (verified in the schema).
- Nurses to update `onboarding_checklists`.

The `form_submissions.submitted_by` column will record the nurse's user_id when assisting; the form payload will carry `completed_with_nurse_assistance: true` for audit clarity. Patient signature is still captured on the signature canvas.

### Kiosk PIN
Stored in `sessionStorage` (cleared on tab close). First kiosk launch in a session prompts the nurse to set a 4-digit PIN. Exit-kiosk requires the PIN. This is intentionally lightweight — it's a UX guard to stop a curious patient from poking around mid-form, not a security boundary.

### Feature flag
Add a new `feature_flags` row `nurse_can_assist_forms` (default `true`) so Gail can disable this from Settings later, as you mentioned. Read via existing `useClinicSettings`/feature-flag hook in `JobCardOnboarding` to hide the actions if disabled.

## Out of scope
- Changing the patient self-onboarding portal flow.
- Editing already-submitted forms (admins still own amendments).
- Reworking signatures (existing signature canvas is reused).
