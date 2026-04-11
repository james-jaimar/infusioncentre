

## Plan: Consolidate Form Submission Tabs into a Single "Completed Forms" Tab

### Problem
Each completed form submission currently creates its own tab in the patient detail view. With 10 forms, this clutters the tab bar (visible in your screenshot).

### Solution
Replace all the dynamic per-submission tabs with a single **"Completed Forms"** tab. Inside that tab, show a list of all completed submissions. Clicking a submission opens the existing `FullScreenFormDialog` in read-only mode (with the print button already built in).

### Changes — single file: `src/pages/admin/PatientDetail.tsx`

1. **Remove the dynamic `TabsTrigger` loop** (lines 435-461) that creates one tab per submission.

2. **Add one static "Completed Forms" tab trigger** after the Account tab, with a count badge (e.g. "Completed Forms 3/10").

3. **Replace the dynamic `TabsContent` blocks** (lines 1128-1188) with a single `TabsContent value="completed-forms"` containing:
   - A list/table of completed submissions: form name, submission date, status badge
   - Each row has a "View" button and a "Print" button
   - "View" opens the `FullScreenFormDialog` in read-only mode (reusing existing dialog)
   - "Print" calls the existing `openPrintableForm` function

4. **No new files or components needed** — everything reuses existing infrastructure (`FullScreenFormDialog`, `openPrintableForm`, `FormRenderer`).

### UX flow
```text
Patient Detail → Tabs: Profile | Medical History | Documents | Onboarding | Communications | Account | Completed Forms (3)
                                                                                                         ↓
                                                                                              List of submissions
                                                                                              ├── Ketamine Questionnaire — 2026/04/10 — [View] [Print]
                                                                                              ├── POPI Consent — 2026/04/09 — [View] [Print]
                                                                                              └── Patient Info & Agreement — 2026/04/08 — [View] [Print]
                                                                                                         ↓ (View)
                                                                                              FullScreenFormDialog (read-only + print button)
```

