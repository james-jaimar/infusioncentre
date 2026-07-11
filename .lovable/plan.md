## Simplify appointment badges on dashboard & calendar

Gail's dashboard should surface **attention**, not history. Once a rescheduled appointment has been re-confirmed by the patient, the "Rescheduled" badge is noise — collapse to a single "Confirmed" badge.

### Badge rules (single source of truth)

For any appointment row, show **one** status badge based on this priority:

| Condition | Badge | Color |
|---|---|---|
| `status = cancelled` | Cancelled | red |
| `status = no_show` | No-show | red |
| `patient_confirmed_at IS NOT NULL` (regardless of reschedule history) | Confirmed | green |
| `reschedule_reason IS NOT NULL AND patient_confirmed_at IS NULL AND status = 'scheduled'` | Needs re-confirm | amber |
| `status = 'confirmed' AND patient_confirmed_at IS NULL` | Admin confirmed | slate |
| else | Awaiting | amber/neutral |

Key change: **drop the "Rescheduled" badge entirely from list/dashboard views**. The reschedule fact is only relevant while it still needs action ("Needs re-confirm"). Once the patient re-confirms, it's just "Confirmed".

Reschedule history remains visible in the appointment detail dialog / drawer (where an admin *is* looking for context), just not on scan-and-triage surfaces.

### Files to change

- `src/pages/admin/AdminDashboard.tsx` — Today's Appointments list: remove the standalone "Rescheduled" pill; render only the single status badge per the table above.
- `src/pages/admin/AdminAppointments.tsx` — Calendar event cells & list view: same collapse. Keep "Needs re-confirm" (amber) as the attention signal for the case Gail actually cares about.
- `src/components/admin/appointments/AppointmentsListView.tsx` — Same collapse if it currently shows a separate reschedule badge.
- Appointment detail / edit dialogs — leave the "Rescheduled" indicator + reason visible here; this is the deep-dive surface.

### Verification

- James Hawkins III 11:00 (rescheduled + re-confirmed) → shows only green **Confirmed**.
- Mark Hawkins 14:30 (rescheduled, not yet confirmed) → shows amber **Needs re-confirm** (no duplicate "Awaiting").
- Moto Moto 12:00 (never rescheduled, not confirmed) → **Awaiting**.
- Opening any of the above in the detail dialog still shows the reschedule reason & history.
