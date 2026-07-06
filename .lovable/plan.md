## Goal
Make the admin app feel live: when patients confirm via SMS, request reschedules, send messages, or new referrals/patients arrive, the UI updates without a manual refresh — and the admin gets a toast alert.

## Root cause
Only the `messages` table is in the Supabase realtime publication, and only a few hooks subscribe to it. Everything else (appointments, `appointment_change_requests`, referrals, patients, contact submissions) relies on 30s polling or refetch-on-focus, so admins see stale data between polls.

## Changes

### 1. Enable realtime on the tables that drive dashboard/action signals
Migration adding to `supabase_realtime` publication and setting `REPLICA IDENTITY FULL` for update-diff support:
- `appointments`
- `appointment_change_requests`
- `referrals`
- `patients`
- `contact_submissions`
- `onboarding_checklists`
- `form_submissions`

(messages is already enabled.)

### 2. Shared realtime helper
Create `src/hooks/useRealtimeInvalidate.ts` — a small hook that subscribes to one or more Postgres change events and invalidates a list of react-query keys. Handles the `useEffect` + `removeChannel` cleanup so we don't leak subscriptions.

### 3. Wire realtime into the data hooks (invalidate + optional toast)
- `useAppointmentChangeRequests` → subscribe to `appointment_change_requests`; on INSERT show a toast "New reschedule request from {patient}" and invalidate the pending list.
- `useAppointments` (list + detail queries) → subscribe to `appointments`; invalidate list, day/week views, and today/tomorrow dashboard queries. On UPDATE where `patient_confirmed_at` changed from null → set, toast "Patient confirmed {name} — {time}".
- `useReferralsAttentionCount` already refetches; add realtime on `referrals` to invalidate immediately.
- `usePatientPipelineCounts` → realtime on `patients` and `onboarding_checklists`.
- `useUnreadPatientMessages` / `useUnreadMessageCount` already have message realtime — extend to also toast on new inbound message when the admin isn't on that patient's message tab.
- Dashboard stats query key (`admin-dashboard-stats`) → invalidated by the appointment and change-request subscriptions.

### 4. Global notification listener
Add `src/components/admin/RealtimeNotifications.tsx`, mounted once inside `AdminLayout`. It:
- subscribes to `appointment_change_requests` INSERT, `appointments` UPDATE (confirmation), and `messages` INSERT (excluding own messages)
- fires shadcn `toast()` notifications with a "View" action that routes to the relevant page (dashboard actions panel, appointment detail, or patient messages tab)
- also plays a subtle browser tab title pulse (`document.title` prefix `(N) …`) while unread actions exist, so a backgrounded tab still signals activity

### 5. Small UX cleanup
- Dashboard Actions panel: keep its existing 30s poll as a fallback, but rely primarily on realtime invalidation for instant updates.
- Ensure all new `supabase.channel(...)` calls live inside `useEffect` with `removeChannel` cleanup (per project rule) to avoid subscription loops.

## Out of scope
- Push notifications outside the browser (OS/mobile push).
- Sound alerts (can add later if Gayle wants an audible cue).
- Nurse/patient/doctor layouts — this pass focuses on the admin surface where the complaint lives. Same pattern can be extended later.

## Technical notes
- Realtime + RLS: subscribers only receive rows they can already SELECT, so admin policies already cover this; no policy changes needed.
- `REPLICA IDENTITY FULL` is required for UPDATE payloads to include old values (needed to detect confirmation transition).
- Query keys touched: `appointment-change-requests`, `unread-patient-messages`, `unread-message-count`, `admin-dashboard-stats`, `appointments`, `referrals-attention-count`, `patient-pipeline-counts`.
