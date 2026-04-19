

## Plan: Fix Referral Triage Workflow

### Root cause analysis

**1. Patient Match — not persistent**
`linkedPatientId` is local React state that only writes to DB when a status transition fires. Switching tabs or closing the dialog discards the link. Also, the state is initialized once via `useState(referral?.patient_id)` — if the parent reuses the dialog component instance across different referrals, state is stale.

**2. Actions tab — buttons appear to do nothing**
- The current test referral is in `under_review` but the user sees "Cancel" / "Info Received" — meaning at some point it slipped into `info_requested` (those are the only two transitions from that state).
- `handleTransition` calls `updateStatus.mutateAsync` → on success closes the dialog. But the email send (`supabase.functions.invoke("send-email")`) runs *before* the toast and is wrapped in try/catch. If the function call hangs (cold start), the user sees nothing happen for several seconds, then the dialog closes silently.
- "Accept" should require a linked patient but currently doesn't enforce it — admin can accept without patient, then can't convert.

**3. Status display badge is stale**
The dialog's status badge reflects `referral.status` from props. After a transition, the dialog closes immediately so user never sees the new status — fine, but if they reopen they need fresh data.

**4. Convert flow**
`canConvert = status === "accepted" && linkedPatientId` — but the dialog closes on accept, so the user has to reopen to convert. Friction.

### What to fix

**A. Persist patient link immediately when chosen**
- When user clicks a patient match (or creates a new patient), write `patient_id` to the referral row immediately via a small mutation (`useLinkReferralPatient`) — don't wait for status transition.
- Reset local state when `referral.id` changes (key the dialog or use `useEffect`).
- Re-fetch the referral after linking so badge/state reflects truth.

**B. Actions tab — make it work and visible**
- Move action buttons into a clear "Decision" section with three primary actions matching status:
  - From `pending`: **Start Review** (moves to under_review) | **Reject**
  - From `under_review`: **Accept Referral** (requires linked patient — disable + show "Link a patient first" if missing) | **Request More Info** | **Reject**
  - From `info_requested`: **Mark Info Received** (back to under_review) | **Cancel Referral**
  - From `accepted`: **Convert to Treatment Course** (primary CTA) | **Cancel**
- Add immediate success/error toasts; don't swallow email failures silently — log them but show success toast for the status change regardless.
- Don't auto-close the dialog on transition — refresh in place so the user sees the new status and the next set of available actions. Only close on explicit Cancel or after Convert-to-Course.
- Add a loading state on the clicked button.

**C. Auto-progress on accept-with-patient-linked**
- When user clicks Accept and a patient is linked, immediately enable a prominent "Convert to Treatment Course →" CTA in the same dialog (no need to reopen).

**D. Add a status history timeline**
- Show transition history on the Details tab (read from `audit_log` filtered by `details->>referral_id` or add a small `referral_status_history` log via the update mutation). Quick win: append a JSON entry to `referral.notes` or write to `audit_log` on each transition.
- For now: write to `audit_log` on each transition (table already exists, admins can view).

**E. Email send — make it non-blocking**
- Fire-and-forget the doctor notification (don't `await` it before showing the toast). Currently it `await`s inside try/catch — the *await* itself can take 2-5s on cold start, making the UI feel frozen.

**F. Visual polish on Patient Match tab**
- Show a clear "✓ Linked to: Jane Doe" banner at the top of the Patient Match tab when a link exists, with an "Unlink" button.
- Auto-select on email/phone exact match (suggested earlier — implement now).

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/useReferrals.ts` | Add `useLinkReferralPatient` mutation; have status update mutation also write an `audit_log` entry |
| `src/components/admin/referrals/ReferralTriageDialog.tsx` | Reset state on referral change; persist patient link immediately; rebuild Actions tab; don't auto-close; non-blocking email; surface "Convert to Course" inline after accept |
| `src/components/admin/referrals/PatientMatcher.tsx` | Auto-link on exact email/phone match; show "Linked" banner; add Unlink button |
| `src/components/admin/referrals/ReferralStatusTimeline.tsx` (new) | Render transition history from `audit_log` |
| `src/pages/admin/AdminReferrals.tsx` | Pass a `key={selectedReferral?.id}` to the dialog so state resets cleanly |

No DB schema changes. Status dictionaries and transitions are already correct.

### What stays the same

- Status dictionary values & transitions (verified correct in DB)
- Doctor notification template (just made non-blocking)
- Convert-to-Course dialog (already accepts referral props from earlier fix)

