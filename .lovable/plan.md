## What you actually saw

Most of those console messages are harmless preview-environment noise, not real bugs in your app. Worth separating them out:

| Message | Cause | Action |
|---|---|---|
| `postMessage ... target origin 'https://lovable.dev' does not match` | Lovable preview iframe handshake; only appears in the in-editor preview, never on your published site. | Ignore — not from your code. |
| `A listener indicated an asynchronous response... message channel closed` | Caused by a browser extension (typically a password manager or ad-blocker), not your app. | Ignore. |
| `WebSocket is closed before the connection is established` | Supabase Realtime socket being torn down when you navigated between pages mid-connect. | Ignore — expected on fast nav. |
| `[DOM] Password field is not contained in a form` | Real, but cosmetic. The "Set Password Directly" inputs in `PatientAccountTab.tsx` aren't wrapped in a `<form>`. Browsers warn because it hurts password-manager UX. | Fix (small). |

So none of those errors are why the reset email felt slow.

## Why the reset was slow

The `password-reset` Edge Function (action `admin-reset-email`) does the SMTP send **inline** before responding. The current sequence is:

```text
click "Send Reset Email"
  → invoke edge function
      → look up user
      → invalidate old tokens, insert new token
      → open SMTP connection (TLS handshake)
      → send email
      → close SMTP connection
  ← respond { success: true }
toast "sent"
```

The SMTP handshake + send against your provider typically takes 2–6 seconds. The UI button stays in its loading state for the whole round-trip, which is what felt "quite a long time".

The `request` action (public forgot-password) is even worse because it additionally calls `auth.admin.listUsers()` which paginates through every user.

## Plan

### 1. Make admin reset feel instant (background send)

In `supabase/functions/password-reset/index.ts`:

- For `admin-reset-email` and `request`: create the token synchronously (so we know it exists), then dispatch the SMTP send via `EdgeRuntime.waitUntil(...)` and respond `200` immediately. The `communication_log` row already records `pending → sent/failed`, so admins can still see delivery status in the Communications log if anything fails.
- Replace `auth.admin.listUsers()` in the public `request` action with a direct lookup against `profiles`/`auth.users` by email (single query) instead of paginating all users.
- Reuse a single `SMTPClient` per invocation (already fine) and ensure `client.close()` runs in a `finally` so a hung connection can't block the next call.

Net effect: button returns in ~200ms instead of 2–6s. Email still arrives the same moment it does today.

### 2. Silence the password-field DOM warning

Wrap the "Set Password Directly" inputs in `src/components/admin/PatientAccountTab.tsx` in a `<form onSubmit={...}>` and change the button to `type="submit"`. Same for `src/components/admin/staff/ResetPasswordDialog.tsx` "Set new password" tab. This also lets password managers offer to save the new password.

### 3. Add a tiny safety net

Surface a follow-up toast if `communication_log` records `failed` for that recipient within ~10s of the click — so if SMTP genuinely breaks, the admin still finds out without having to dig into the log. (Optional; only if you want it. Without this, failures are visible only in Admin → Communications.)

## Files to edit

- `supabase/functions/password-reset/index.ts` — background send + lookup-by-email
- `src/components/admin/PatientAccountTab.tsx` — wrap password inputs in `<form>`
- `src/components/admin/staff/ResetPasswordDialog.tsx` — wrap password inputs in `<form>`
- (optional) `src/components/admin/PatientAccountTab.tsx` — add the failure-toast watcher

## What won't change

- No DB schema changes.
- No change to the reset link, token format, or expiry.
- The published-site behaviour is unchanged apart from being faster.

Want me to include step 3 (failure-toast watcher), or keep it to steps 1 + 2?