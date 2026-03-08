

## Fix: Doctor Creation & Login Flow

### Root Cause Analysis

There are **three distinct issues**:

**1. "Account Pending Approval" — the `handle_new_user` trigger races with `create-staff`**

When `create-staff` calls `adminClient.auth.admin.createUser()`, Postgres fires the `handle_new_user` trigger which:
- Inserts a profile with `is_approved = false` (column default)
- Inserts a `user_roles` entry with role `patient`

Then `create-staff` tries to insert its own profile (with `is_approved = true`) and role (`doctor`), but both fail silently because the rows already exist from the trigger. Result: the doctor has `is_approved = false` and role `patient`.

**2. Doctor name shows "Unknown"**

The `openEdit` function references `doc.profiles?.first_name` but the query fetches profiles separately into a `profileMap` — the `profiles` property doesn't exist on the doctor object. The edit dialog's name fields start empty, and the trigger-created profile has no first/last name (since `create-staff` doesn't pass `raw_user_meta_data`).

**3. No forced password change on first login**

The invite email tells doctors to use a temporary password but there's no mechanism to force them to set a new one.

---

### Fix Plan

#### A. Fix the `create-staff` Edge Function

Update `create-staff` to pass `first_name` and `last_name` in `user_metadata` so the trigger picks them up. Then, instead of inserting profile/role rows (which conflict with the trigger), **upsert or update** them after creation:

1. Pass `user_metadata: { first_name, last_name }` to `createUser()` so the trigger creates the profile with the correct name
2. After user creation, **update** the profile to set `is_approved = true`
3. **Update** the user_roles row to change role from `patient` to the requested role (e.g., `doctor`)

This avoids the race condition entirely — work *with* the trigger instead of against it.

#### B. Fix the Edit Dialog name fields in `AdminDoctors.tsx`

In `openEdit`, use the `doctor_name` that was already resolved from the profileMap, and split it back into first/last. Better: store `profile_first_name` and `profile_last_name` from the profileMap during the query so the edit dialog can use them directly.

#### C. Add forced password change for doctors on first login

- Add a `must_change_password` boolean column to the `doctors` table (default `true`)
- On login, if the user is a doctor and `must_change_password` is true, redirect to a password change page instead of the doctor portal
- After successful password change, set `must_change_password = false`
- Create a simple `/change-password` page with current + new password fields

#### D. Update the invite email

Include the temporary password in the email body so the doctor knows their initial credentials. Update `send-doctor-invite` to accept and display the password, and update `AdminDoctors.tsx` to pass it when sending the invite right after creation.

---

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/create-staff/index.ts` | Pass user_metadata, update (not insert) profile and role after trigger fires |
| `src/pages/admin/AdminDoctors.tsx` | Fix openEdit to use profileMap data; optionally send password in invite |
| `supabase/functions/send-doctor-invite/index.ts` | Accept optional temp password to include in email |
| `src/pages/Login.tsx` | Add doctor must_change_password check, redirect to change-password page |
| `src/pages/ChangePassword.tsx` | New page for forced password change |
| `src/App.tsx` | Add `/change-password` route |
| Migration | Add `must_change_password` column to `doctors` table |

