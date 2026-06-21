## What we're building

Nicole's feedback is all about one thing: **the appointment board has to feel like a real, fast, daily-use schedule** — Google-Calendar-quick to add, glanceable for "what's happening in every chair right now", and forgiving when admin/nurses pass a patient between them. This plan reshapes the Day view, the create flow, the patient model on the front desk, and adds two small but high-leverage touches (arrived status + tomorrow's call-list).

Nothing changes structurally outside Appointments + Command Centre. Treatment courses, billing, nurse job-card flow are all left alone.

---

## 1. New Day view: chairs as columns, time as rows (the mockup)

Today the Day view shows **chairs as rows** and time runs left-to-right. The mockup flips this: each chair is a vertical column, time flows top-to-bottom from 7am, and every appointment is a block in its chair's column. This is the layout Nicole and Gayle naturally read.

```text
        Chair 1     Chair 2     Chair 3     Chair 4     Treatment Room
7 AM    ┌─────┐
8 AM    │     │     ┌──────────┐
9 AM    │ JH  │     │ Ketamine │
10 AM   │     │     │  10:00–  │
11 AM   └─────┘     │  14:30   │
12 PM               └──────────┘
1 PM                                        ← click empty slot = quick-add
…
```

Behaviour:
- **Click any empty 30-min slot** → opens the quick-create popup pre-filled with that chair + start time (today this only works on appointment cards; empty space is dead).
- **Drag still works** vertically (move time) and horizontally (move to another chair column).
- **"Now" line** drawn across all chair columns at the current time when viewing today.
- The current Day-view rendering (chairs-as-rows) is replaced; Week view keeps its existing layout because spreading 4–5 chairs × 7 days as columns is unreadable.
- Treatment Room shows alongside chairs (it already exists as a `treatment_chair` row).

## 2. Quick-create popup: faster, with inline "quick-add patient"

The existing `AppointmentQuickCreateDialog` already covers patient + type + time + chair + nurse + notes. Three changes:

1. **"+ New patient" inside the patient search** — when the search returns nothing (or the user clicks an "Add new patient" row at the top of the list), the popover swaps to a 4-field mini-form: **First name, Last name, Email, Mobile**. On save it creates the patient record, returns the id, and the appointment continues with that patient selected. The full patient file is filled in later — exactly Nicole's phone-booking case.
2. **Pre-fill from the clicked slot** — start time + chair come from the empty cell click; admin just picks patient + treatment type.
3. **Conflict line** — if the chosen chair/time clashes with another appointment, show inline red text "Chair 2 is busy 10:00–10:30 (James Hawkins)" instead of failing on submit.

The "Open full form" escape hatch stays for complex cases (recurring, course-linked).

## 3. New "Arrived" status — handoff between front desk and nurse

Today the flow is `scheduled → confirmed → checked_in → in_progress`. Nicole wants an explicit **Arrived** step between confirmed and checked_in so the front desk can mark "they're here, sat in Chair 3" without starting the nurse's check-in form.

- Add `arrived` to the `appointment_status` enum.
- Day-view appointment cards get a one-tap **"Mark arrived"** button (and a chair picker, since arrival is also when chairs get juggled — "we moved her to Chair 4 because Chair 2's pump is acting up").
- The Command Centre chair panel already has a "Checked-in" reservation state from last session — it picks up `arrived` the same way and shows the patient sitting in the chair, with a clear visual difference from "checked in by nurse".
- The nurse's existing check-in screen continues to advance `arrived → checked_in` when they open the patient's job card.
- Audit log captures who marked them arrived and when (the existing `log_status_change` trigger handles this automatically).

## 4. Command Centre: "Tomorrow's appointments" copy strip

A new panel on the Command Centre listing tomorrow's appointments as plain rows:

```text
Tomorrow — Mon, Jun 22 · 6 appointments
────────────────────────────────────────────────────────────
09:00  Jane Smith        082 555 1234   Iron Infusion       [Copy]
10:30  Pieter van Wyk    071 222 0987   Ketamine Therapy    [Copy]
…                                                            [Copy all]
```

- **Copy** on a row puts a ready-to-paste WhatsApp reminder on the clipboard ("Hi Jane, reminder of your Iron Infusion appointment tomorrow at 09:00 at The Johannesburg Infusion Centre. Reply to confirm."). Template lives in `clinic_settings` so Gayle can edit it later.
- **Copy all** copies the whole list as a block.
- Read-only data already in `appointments` + `patients`; no schema changes for this panel.

This is the "nice-to-have" Nicole flagged, but it's cheap and lands a visible win.

---

## Technical notes

**Schema (one migration):**
- `ALTER TYPE appointment_status ADD VALUE 'arrived' BEFORE 'checked_in';`
- Optional reminder template column: `ALTER TABLE clinic_settings ADD COLUMN tomorrow_reminder_template text;` with a sensible default.

**Files touched:**
- `src/pages/admin/AdminAppointments.tsx` — rewrite the Day view branch (week/month/list untouched). Drop chairs-as-rows in favour of chairs-as-columns with an empty-slot click handler.
- `src/components/admin/AppointmentQuickCreateDialog.tsx` — add inline "new patient" sub-form path; pre-fill from click; inline conflict message.
- `src/components/admin/AppointmentQuickEditDialog.tsx` — add "Mark arrived" + chair re-assign control.
- `src/types/appointment.ts` — extend `AppointmentStatus` union with `'arrived'`; STATUS_BG palette gets a new colour.
- `src/hooks/usePatients.ts` — `useCreatePatientQuick` mutation (4 fields, defaults the rest).
- `src/hooks/useAppointments.ts` — `useMarkArrived` mutation.
- `src/hooks/useCommandCentre.ts` + `src/pages/nurse/NurseCommandCentre.tsx` — derive `tomorrowsAppointments`; new `<TomorrowsReminderList />` component under `src/components/nurse/command-centre/`.
- Status dictionary seed row for `arrived` so it shows up in filters/legends consistently.

**Out of scope (call out, don't build now):**
- Automated WhatsApp/SMS sending — copy-to-clipboard only for now.
- Recurring sessions UX — unchanged.
- Mobile-specific calendar layout — desktop/tablet focus, as today.

---

## Suggested build order

1. Migration: `arrived` enum value + reminder template column.
2. Day view re-layout + empty-slot click → opens existing quick-create popup pre-filled.
3. Quick-add patient inside the create dialog.
4. Arrived status: card button, chair re-assign, Command Centre chair panel pickup.
5. Tomorrow's appointments panel on Command Centre.

Each step is independently shippable, so we can pause and let Gayle/Nicole try it after step 2 if you want feedback before going further.
