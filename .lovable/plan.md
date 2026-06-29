## Goal

Automatically text every patient ~24 hours before their appointment, using **SMSPortal** (smsportal.com — the South African SMS gateway). Admin can configure sender ID, template, on/off, and test-send from Settings. Each send is logged so we have an audit trail.

## What the user will see

1. **Settings → SMS tab** (new)
   - Toggle: *Send 24h appointment reminders* (on/off)
   - Field: *Sender ID* (e.g. "InfusionCtr", max 11 chars)
   - Field: *Reminder template* with merge tags `{{first_name}}`, `{{time}}`, `{{date}}`, `{{treatment_type}}`, `{{clinic_name}}`
     - Default mirrors the existing WhatsApp reminder copy already in `TomorrowsReminderList.tsx`.
   - Field: *Send time* (default 17:00 SAST, day before)
   - Button: *Send test SMS* → prompts for phone number, fires through the edge function once
   - Read-only status: last cron run, # sent, # failed (last 7 days)

2. **Communication Hub → existing Email Log gains a "Channel" filter**
   - SMS sends already write to `communication_log` (`type = 'sms'`), so they appear here automatically. Just add the SMS filter tab.

3. **Appointment quick-edit dialog** — small row: *Reminder: ✓ sent 18:03 / ✗ failed / scheduled for tomorrow 17:00*.

## How it works

1. **SMSPortal credentials** are stored as Lovable secrets (`SMSPORTAL_CLIENT_ID`, `SMSPORTAL_API_SECRET`). I'll request these via `add_secret` after you confirm the plan. SMSPortal's REST API uses HTTP Basic auth to mint a bearer token, then `POST /v2/bulkmessages` to send.

2. **New edge function `send-sms`** (callable, `verify_jwt = false` with internal admin-token check)
   - Inputs: `to` (E.164), `message`, optional `related_entity_type` + `related_entity_id`.
   - Auth: gets bearer token from SMSPortal, POSTs the message, writes a row to `communication_log` (status `sent`/`failed`, error msg, provider event id).

3. **New edge function `dispatch-appointment-reminders`** (cron-triggered)
   - Reads `clinic_settings` for SMS config; bails if disabled.
   - Selects appointments where `scheduled_start` is between *now + 23h* and *now + 25h*, status not cancelled, and no row exists in `appointment_reminders` with `channel='sms'` for that appointment.
   - For each one: fills the template, calls `send-sms`, inserts an `appointment_reminders` row (already exists in schema — 9 columns).
   - Idempotent: re-runs won't double-send because of the `appointment_reminders` lookup.

4. **Cron**: `pg_cron` job runs `dispatch-appointment-reminders` **every hour** (cheap, lets the user pick any send-hour without redeploys). The function itself decides whether the current hour matches the configured send time.

5. **`clinic_settings`** gains 4 new keys (category `sms`): `sms_enabled`, `sms_sender_id`, `sms_reminder_template`, `sms_reminder_send_hour`. No new table needed.

## Files to add / change

**Edge functions (new)**
- `supabase/functions/send-sms/index.ts` — SMSPortal client + log writer
- `supabase/functions/dispatch-appointment-reminders/index.ts` — cron worker
- `supabase/config.toml` — register both with `verify_jwt = false`

**Frontend (new)**
- `src/components/admin/settings/SmsSettingsTab.tsx` — UI described above
- `src/hooks/useSendSms.ts` — small wrapper for the test-send button
- `src/pages/admin/AdminSettings.tsx` — add the "SMS" tab

**Frontend (small touch-ups)**
- `src/components/admin/AppointmentQuickEditDialog.tsx` — show reminder status pill
- `src/pages/admin/AdminCommunications.tsx` — pass channel filter into `EmailLogTab` (rename internal filter, keep visual)

**Migration**
- Seed the 4 new `clinic_settings` rows (category `sms`)
- Add `pg_cron` job that invokes `dispatch-appointment-reminders` hourly

## Out of scope (ask later if wanted)

- Manual per-patient *Send SMS* button on patient/appointment screens
- Editable SMS templates beyond the single reminder
- Inbound/2-way SMS, delivery receipts beyond the initial accepted/rejected status
- SMS for anything other than 24h reminders (no-show follow-up, course completion, etc.)

## Confirmations needed before I build

1. You have an SMSPortal account and can grab the **Client ID** and **API Secret** from `rest.smsportal.com → API Credentials` — I'll ask for them via the secure secret form once you approve the plan.
2. Default Sender ID I should pre-fill: **"InfusionCtr"** (11 chars). Change if you prefer.
3. Default send-time **17:00 SAST** the day before. Change if you prefer.
