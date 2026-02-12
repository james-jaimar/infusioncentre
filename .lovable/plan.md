

# SMTP Email Edge Function Setup

## Overview

Build a reusable `send-email` Edge Function using `denomailer` for ALL outgoing emails, including password resets. No Supabase Dashboard SMTP config -- everything goes through the Edge Function.

## Secrets Needed (5)

| Secret | Example |
|---|---|
| SMTP_HOST | mail.yourdomain.com |
| SMTP_PORT | 587 |
| SMTP_USERNAME | noreply@yourdomain.com |
| SMTP_PASSWORD | your password |
| SMTP_FROM_EMAIL | noreply@infusioncentre.co.za |

## What Gets Built

### 1. New Edge Function: `send-email`

General-purpose SMTP sender using `denomailer`. Accepts `to`, `subject`, `html`, `text`. Logs all attempts to `communication_log` table.

### 2. Update `send-patient-invite`

After creating the invite record, sends a branded email with the invite link via `send-email` logic.

### 3. Custom Password Reset Flow

Replace `supabase.auth.resetPasswordForEmail()` in `ForgotPassword.tsx` with a custom flow:

- New Edge Function action or endpoint: generates a secure reset token, stores it in a new `password_reset_tokens` table, and sends a branded reset email via SMTP
- Update `ResetPassword.tsx` to validate the token and call `supabase.auth.admin.updateUserById()` via an edge function to set the new password

### Database Changes

**New table: `password_reset_tokens`**

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | References profiles.user_id |
| token | TEXT | Unique, secure token |
| email | TEXT | User's email |
| created_at | TIMESTAMPTZ | Default now() |
| expires_at | TIMESTAMPTZ | Default now() + 1 hour |
| used | BOOLEAN | Default false |

RLS: No public access. Service role only.

### Files

| File | Change |
|---|---|
| supabase/functions/send-email/index.ts | NEW -- reusable SMTP sender with denomailer |
| supabase/functions/send-patient-invite/index.ts | UPDATE -- send invite email after creation |
| supabase/functions/password-reset/index.ts | NEW -- generate token + send reset email, and handle reset completion |
| supabase/config.toml | Add send-email and password-reset functions |
| src/pages/ForgotPassword.tsx | UPDATE -- call password-reset edge function instead of supabase.auth.resetPasswordForEmail() |
| src/pages/ResetPassword.tsx | UPDATE -- validate custom token, call edge function to set new password |

### Email Templates (built into the edge functions as HTML strings)

- **Patient Invite**: Branded email with patient name, invite link, expiry info, clinic contact
- **Password Reset**: Branded email with reset link, expiry (1 hour), clinic contact

### Flow

```text
Password Reset:
User enters email -> password-reset edge function generates token
-> sends branded email via send-email -> user clicks link
-> ResetPassword page validates token -> user sets new password
-> edge function calls admin.updateUserById() to update password

Patient Invite:
Admin/nurse creates invite -> send-patient-invite generates token
-> sends branded email via SMTP -> patient clicks link
-> InviteLanding page handles registration
```

