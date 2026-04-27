# Staff Management Overhaul

Bring the Staff Management page (`/admin/staff`) up to a full administrative console — exposing email/login data, password management, account status, last sign-in, and richer profile fields, with proper CRUD via secure edge functions.

## Current Gaps

- Email is not displayed (only stored in `auth.users`, never fetched on list).
- No way to reset a staff member's password.
- No way to disable / re-enable an account (only "remove role").
- Edit dialog can't change the email address.
- No last sign-in / status indicators.
- "Delete" only strips the role — leaves the auth user, profile, and (for doctors) the doctors row dangling.
- Doctor-specific fields (practice name/number, specialisation) aren't editable after creation.
- Card UI is sparse; no table view, no quick filters by status.

## What We'll Build

### 1. New/updated edge functions (admin-only, service-role)

| Function | Purpose |
|---|---|
| `list-staff` (new) | Returns staff merged with `auth.users` (email, last_sign_in_at, banned_until, email_confirmed_at) + profile + role + doctor record. Replaces the client-side join in `useStaffMembers`. |
| `update-staff` (new) | Update profile (name/phone), role (with cascade — remove from `doctors` if leaving doctor role, insert if becoming doctor), email (`auth.admin.updateUserById`), and doctor-specific fields. |
| `reset-staff-password` (new) | Two modes: (a) set a new password directly via `auth.admin.updateUserById`, or (b) send a recovery email via `auth.admin.generateLink({ type: 'recovery' })` routed through existing SMTP. |
| `set-staff-status` (new) | Ban/unban via `auth.admin.updateUserById({ ban_duration: '876000h' \| 'none' })` to disable login without deleting data. |
| `delete-staff` (existing) | Already does full cascade (doctors → user_roles → profiles → auth user). Keep as-is. |
| `create-staff` (existing) | Keep, plus add option to send an invite email instead of admin-set password. |

All functions verify caller is `admin` via `user_roles` (same pattern as existing `create-staff`/`delete-staff`).

### 2. Redesigned `AdminStaff.tsx` page

**Header**
- Title + total count + per-role counts (Admin / Nurse / Doctor).
- Search (name, email, phone) + role filter + status filter (Active / Disabled / Pending email confirmation).
- View toggle: **Cards** (default, current visual style) and **Table** (denser, sortable).
- "Add Staff" button (existing) — extended dialog (see §3).

**Each staff row/card shows**
- Avatar (role icon), full name, role badge.
- Email (with copy-to-clipboard).
- Phone.
- Status pill: Active / Disabled / Email unconfirmed.
- Last sign-in (relative, e.g. "2 days ago" / "Never").
- Joined date.
- Action menu (kebab): Edit, Reset password, Send password-reset email, Disable/Enable account, Delete.

**Table view columns**: Name · Email · Role · Status · Last sign-in · Joined · Actions.

### 3. Dialogs

- **Add Staff** (extend existing): adds a "Send invite email" toggle — when on, password field hides and a recovery email is sent on creation. Doctor-specific fields stay conditional.
- **Edit Staff** (expand): editable email, name, phone, role; doctor section with practice name/number/specialisation when role = doctor. Warns when changing email (user must reconfirm).
- **Reset Password** (new): two tabs — "Set new password" (admin types it, optional "force change on next login" → sets `doctors.must_change_password` for doctors / a profile flag otherwise) and "Email reset link" (one-click).
- **Disable / Enable confirmation**: explains effect (login blocked, data preserved).
- **Delete confirmation** (rewrite): clearly states full cascade — auth user, profile, role, doctor record all deleted. Distinguish from Disable.

### 4. Schema additions

Minimal — most data already exists.
- Add `must_change_password boolean default false` to `profiles` (doctors table already has it). This lets admins force a password change for non-doctor staff after a manual reset.

No other schema changes needed — `auth.users` already has `email`, `last_sign_in_at`, `banned_until`, `email_confirmed_at`.

### 5. Login enforcement

In `AuthContext` post-login flow, check `profiles.must_change_password` (in addition to existing `doctors.must_change_password`) and redirect to `/change-password` if true. Clear the flag after successful change.

## Files Affected

**New**
- `supabase/functions/list-staff/index.ts`
- `supabase/functions/update-staff/index.ts`
- `supabase/functions/reset-staff-password/index.ts`
- `supabase/functions/set-staff-status/index.ts`
- `src/components/admin/staff/StaffTable.tsx`
- `src/components/admin/staff/StaffCard.tsx`
- `src/components/admin/staff/StaffFormDialog.tsx` (shared create/edit)
- `src/components/admin/staff/ResetPasswordDialog.tsx`
- `src/hooks/useStaff.ts` (list + mutations)

**Edited**
- `src/pages/admin/AdminStaff.tsx` (rewritten)
- `supabase/functions/create-staff/index.ts` (add invite-email mode)
- `src/contexts/AuthContext.tsx` (honor `profiles.must_change_password`)
- `supabase/config.toml` (register new functions)

**Migration**
- Add `profiles.must_change_password boolean default false`.

## Out of Scope (ask if you want these)

- Granular per-feature permissions (we keep the existing `app_role` enum: admin/nurse/doctor/patient).
- 2FA enrollment management.
- Audit log UI for staff changes (events are still written via existing audit triggers where applicable).
