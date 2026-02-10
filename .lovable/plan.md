

# Phase 10: Communication Hub

## Overview

Build a unified communication system using a direct SMTP edge function ("send-email") for all email needs, plus WhatsApp Business API integration for appointment reminders. No Resend dependency -- all emails go through SMTP directly.

---

## 10A: SMTP Email Edge Function

### Edge Function: `supabase/functions/send-email/index.ts`

A single reusable edge function that connects to an SMTP server and sends templated emails. Uses the Deno `denomailer` library for SMTP.

**Required secrets** (to be added before implementation):
- `SMTP_HOST` -- e.g. `smtp.gmail.com` or mail server host
- `SMTP_PORT` -- e.g. `587`
- `SMTP_USERNAME` -- email account username
- `SMTP_PASSWORD` -- email account password
- `SMTP_FROM_EMAIL` -- sender address, e.g. `noreply@johannesburginfusion.co.za`
- `SMTP_FROM_NAME` -- sender display name, e.g. `Johannesburg Infusion Centre`

**Functionality:**
- Accepts a JSON body with `{ to, subject, html, text }` 
- Optionally accepts a `template` field (e.g. `password_reset`, `booking_confirmation`, `appointment_reminder`) with template variables, so the edge function can render HTML from built-in templates
- Returns success/failure response
- Protected by service role key validation for internal calls

### Email Templates (built into the edge function)

1. **Password Reset** -- branded email with reset link button
2. **Booking Confirmation** -- confirms training course registration with course details
3. **Appointment Reminder** -- patient name, date/time, preparation instructions

---

## 10B: Password Reset Email Flow

### Changes:
- **`src/pages/ForgotPassword.tsx`**: After `supabase.auth.resetPasswordForEmail()` succeeds, also call the `send-email` edge function with the `password_reset` template to send a branded email (Supabase's built-in email still works as the primary mechanism; this adds a branded version)
- Alternatively, configure Supabase Auth to use a custom SMTP server so the built-in password reset emails are sent from your domain. This is the cleaner approach -- update Supabase Auth SMTP settings in the dashboard.

**Recommended approach**: Configure Supabase Auth SMTP settings in the Supabase dashboard (Authentication > Email Templates > SMTP Settings) with the same SMTP credentials. This way `resetPasswordForEmail()` sends branded emails automatically without needing a separate edge function call for password resets.

---

## 10C: Booking Confirmation Emails

### Changes:
- **`src/components/training/CourseBookingForm.tsx`**: After successful booking insert, call the `send-email` edge function with the `booking_confirmation` template, passing participant name, course name, and email address.

---

## 10D: Appointment Reminder Emails

### New Edge Function: `supabase/functions/send-appointment-reminders/index.ts`

A scheduled/callable function that:
1. Queries `appointment_reminders` where `status = 'pending'` and `scheduled_for <= now()`
2. Joins with `appointments`, `patients`, and `appointment_types` to get details
3. Calls the `send-email` function internally for each reminder
4. Updates `appointment_reminders.status` to `sent` (or `failed`) and records `sent_at`

### Admin UI Addition:
- **`src/pages/admin/AdminSettings.tsx`**: Add a "Reminders" configuration section where the admin can set default reminder timing (e.g. 24 hours before, 2 hours before)

---

## 10E: WhatsApp Integration (Placeholder)

Since WhatsApp Business API credentials are not yet available, we will:
1. Create the database infrastructure -- the `appointment_reminders` table already supports `reminder_type = 'whatsapp'`
2. Create a stub edge function `supabase/functions/send-whatsapp/index.ts` that will be completed once credentials are provided
3. Add a UI toggle in admin settings for enabling WhatsApp reminders per appointment type

When the WhatsApp credentials become available, we will connect it and complete the integration.

---

## 10F: Communication Log

### Database Migration:
- Create a `communication_log` table to track all sent communications:

```text
communication_log
-----------------
id (uuid, PK)
type (enum: email, whatsapp, sms)
recipient (text)
subject (text, nullable)
template (text, nullable)
status (enum: pending, sent, failed)
error_message (text, nullable)
related_entity_type (text, nullable -- e.g. 'appointment', 'booking')
related_entity_id (uuid, nullable)
sent_at (timestamptz)
created_at (timestamptz)
```

- RLS: Admin-only read access

### Admin UI:
- **`src/pages/admin/AdminContacts.tsx`** or new **Communications** tab: A log view showing all sent emails/messages with status, filterable by type and date.

---

## Implementation Sequence

1. Add SMTP secrets (will prompt you for credentials)
2. Create `send-email` edge function with templates
3. Update `config.toml` with function config
4. Wire up booking confirmation emails in `CourseBookingForm`
5. Create `send-appointment-reminders` edge function
6. Create `communication_log` table migration
7. Add communication settings to Admin Settings
8. Create WhatsApp stub for future completion
9. Update plan document

---

## Technical Details

### Files to Create:
- `supabase/functions/send-email/index.ts` -- SMTP email sender with templates
- `supabase/functions/send-appointment-reminders/index.ts` -- reminder processor

### Files to Modify:
- `supabase/config.toml` -- add function configs with `verify_jwt = false`
- `src/components/training/CourseBookingForm.tsx` -- add confirmation email call after booking
- `src/pages/admin/AdminSettings.tsx` -- add reminder/communication settings
- `src/integrations/supabase/types.ts` -- updated with new types
- `src/App.tsx` -- add any new admin routes if needed
- `.lovable/plan.md` -- update progress

### Database Migration:
- Create `communication_log` table with RLS policies
- Add `communication_type` and `communication_status` enums

### Dependencies:
- `denomailer` (Deno SMTP library, imported via URL in edge function)
- No new npm packages needed on the frontend

