# Wire chair assignments into the Command Centre

## The problem

In the appointment edit dialog you can assign a patient to "Chair 1", and that saves to `appointments.chair_id`. But the Command Centre's chair grid only shows a chair as occupied when there is a **`treatments`** row in `pre_assessment`, `in_progress`, or `post_assessment`.

Result on today's screen: Chair 1 has three appointments (two completed, one scheduled for 17:30 with chair assigned) but the card says "Available" and the header says "0/4 chairs · 0 Active". Nothing tells the nurse that Chair 1 is spoken for at 17:30.

## What to fix

Change the chair → appointment matching so a chair card reflects the **most relevant appointment of the day on that chair**, in this priority order:

```text
1. Active treatment   (pre_assessment | in_progress | post_assessment)   → existing "Running / Pre / Observing" UI
2. Checked-in appt    (status = checked_in, no treatment yet)            → new "Checked-in" state
3. Next upcoming appt (scheduled | confirmed, scheduled_start ≥ now)     → new "Reserved" state with time + countdown
4. Otherwise                                                             → "Available" (current empty state)
```

Completed/cancelled/no-show appointments are ignored for chair display (but stay on the right-hand "Today's Schedule" panel as they do today).

## UI changes

**ChairPanel.tsx** — add two non-occupant states alongside the existing ones:

- **Reserved** — soft indigo tint (the existing `reserved` styling already exists, just needs to render with patient context). Shows: chair name, patient name, treatment type, "Starts 17:30 · in 1h 12m", and an **Open session** button that navigates to the job card.
- **Checked-in** — soft info/blue tint. Shows patient name, treatment type, "Checked in HH:MM", and **Start pre-assessment** button → job card.

Both reuse the same card frame/header as the occupied state so the floor stays visually consistent.

## Header counters

The pills at the top become more useful:

- `0/4 chairs` → keep showing **active infusions / total chairs**, but also show a small subtitle "+1 reserved" when there are scheduled-on-chair appointments later today.
- `0 Active` pill stays as-is (counts in_progress only).

## Data layer (`useCommandCentre.ts`)

One change, no new queries — `dayAppointmentsQuery` already returns every appointment with `chair_id`, patient, type, and status.

Replace the current chair mapping:

```text
chair.occupant = treatment whose appointment.chair_id == chair.id
```

with a richer per-chair resolver that walks today's appointments for that chair and picks the highest-priority one using the rules above. Expose it as:

```text
chair.occupant   → only when there's an active treatment (unchanged shape)
chair.reserved   → { appointmentId, patientName, treatmentType, scheduledStart, status: "checked_in" | "scheduled" | "confirmed" }
```

`ChairPanel` reads `occupant` first, then falls back to `reserved`, then to plain available.

## Out of scope

- No DB schema changes.
- No change to how chairs get assigned (the appointment edit dialog already does it correctly).
- No change to the "Assign patient" popover on empty chairs — it keeps working for chairs with no reservation.
- No change to discharge / completed handling.

## Files touched

- `src/hooks/useCommandCentre.ts` — extend `ChairData` with `reserved`, rewrite the per-chair resolver.
- `src/components/nurse/command-centre/ChairPanel.tsx` — render `reserved` + `checked_in` states.
- `src/pages/nurse/NurseCommandCentre.tsx` — minor: optional "+N reserved" subtitle on the chairs pill.
