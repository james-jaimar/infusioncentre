

## Plan: Fix Doctor Invite Password Flow

### Problem

The temporary password is only stored in React state (`lastCreatedPassword`) immediately after creating a doctor. If the admin doesn't send the invite in that same session, the password is lost. Additionally, there's no UI to set a new temporary password when re-sending an invite later.

### Solution

Two changes to make this reliable:

#### 1. Auto-send invite immediately after creation

After successfully creating a doctor, automatically send the invite email with the password the admin just entered — no separate manual step needed. This ensures the temp password always reaches the doctor.

#### 2. Add "Reset Password & Re-send Invite" capability

For cases where the doctor needs a new invite later (lost email, expired, etc.):
- Add a "Reset & Re-invite" option in the invite dialog
- Admin can enter a new temporary password (or auto-generate one)
- The Edge Function resets the doctor's password via the Admin API and sends a fresh invite email with the new credentials
- Update `must_change_password` back to `true`

### Files to Change

| File | Change |
|------|--------|
| `src/pages/admin/AdminDoctors.tsx` | Auto-send invite after create; add password reset field to invite dialog with auto-generate option |
| `supabase/functions/send-doctor-invite/index.ts` | Accept optional `new_password` param; if provided, reset the auth user's password via Admin API before sending the email |

### Flow After Changes

**New doctor creation:**
1. Admin fills in doctor details + password → clicks Create
2. Doctor account created → invite email sent automatically with temp password
3. Doctor receives email → logs in → forced to change password

**Re-sending invite later:**
1. Admin clicks Send Invite icon on existing doctor
2. Dialog shows option to set a new temporary password (with auto-generate button)
3. Edge Function resets password + sends email with new credentials
4. Doctor uses new temp password → forced to change on login

