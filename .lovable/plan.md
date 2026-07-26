
## Goal

When anyone (patient, admin, or nurse) fills in an onboarding form, autosave their progress so they can close the form and come back later to continue — nothing typed is ever lost.

## How it will work

**Drafts on `form_submissions`.** We already store completed forms in the `form_submissions` table with `status = 'submitted'`. We reuse the same table for in-progress work by adding a `status = 'draft'` record. Only one draft per patient + form template exists at a time — new keystrokes update that same row rather than creating new ones.

**Opening a form:**
1. When a form is opened for a checklist item, look for an existing draft for that patient + template.
2. If a draft exists, load its saved `data` into the form (so the user sees exactly what they left).
3. If no draft, use current prefill logic (patient record, medical history).

**While editing:**
- Every change is debounced (~1.5s idle) and upserted into the draft row. A subtle "Saved" / "Saving…" indicator appears in the form's top bar.
- Also save on window blur/tab close (`beforeunload` + `visibilitychange`) so a user closing the tab doesn't lose the last few keystrokes.
- On unmount/close of the dialog, flush any pending save.

**Submitting:**
- On submit, promote the same draft row to `status = 'submitted'` (with signature, timestamp, `submitted_by`) instead of inserting a new record. The onboarding checklist item is then marked completed as today.

**Checklist state:**
- Add a lightweight "In progress" indicator to `OnboardingProgress` and the admin/nurse onboarding lists when a draft exists but nothing is submitted yet. Purely visual — the checklist status stays `pending` until submission.

**Scope of surfaces covered:**
- Patient portal (`PatientDashboard` → `FullScreenFormDialog`)
- Admin onboarding tab (`PatientDetail`)
- Nurse `JobCardOnboarding` and `PatientKioskMode`
- Admin amendment editing already works on submitted forms — unchanged.
- Out of scope: the public tokenised form (`PublicForm` / `submit-public-form`) — that path has no authenticated identity to attribute a draft to, so it keeps its current behaviour. We can revisit later using a local-storage draft if you want.

## Technical details

**Data model:** No schema change required. Reuse `form_submissions.status`. A DB partial unique index ensures at most one draft per `(patient_id, form_template_id)`:

```
CREATE UNIQUE INDEX form_submissions_one_draft_per_patient_template
  ON public.form_submissions (patient_id, form_template_id)
  WHERE status = 'draft';
```

**New hook `useFormDraft(patient_id, form_template_id)`:**
- `loadDraft()` — fetches existing draft row (values + id).
- `saveDraft(values)` — upserts on conflict of the partial-unique index; sets `submitted_by = auth.uid()` for RLS.
- `promoteDraft(finalValues, signature)` — updates the draft row to `status='submitted'`.
- `deleteDraft()` — used if the user cancels explicitly (not on plain close).

**`FullScreenFormDialog` changes:**
- New optional props `autosave: { onSave, savedAt, isSaving }` so callers control persistence.
- Header shows "Saving…" / "Saved • 2m ago".
- Debounced effect on `values`, plus `beforeunload` / `visibilitychange` flush.

**Caller changes:**
- `PatientDashboard.handleOpenForm` — after opening, call `loadDraft`; wire autosave; on submit call `promoteDraft` instead of `createSubmission`.
- `PatientDetail` onboarding tab, `JobCardOnboarding`, `PatientKioskMode` — same pattern.

**RLS:** existing `form_submissions` policies already allow the patient (via `submitted_by = auth.uid()` / patient row) and clinic staff to read/write their own — no policy changes needed. Verified against existing 7 policies during implementation.

**Query invalidation:** invalidate `form_submissions` and `onboarding_checklists` on promote; drafts don't need to invalidate the checklist since status stays `pending`.
