

## Admin Approval for New Patient Accounts

### Problem
Currently, anyone can register a patient account via `/register` and immediately access the patient portal. This could be abused by unauthorized users.

### Solution
Add an approval workflow where new self-registered accounts are created in a "pending" state. Only after an admin approves the account can the patient log in and access the portal.

---

### How It Works

1. **New column on `profiles` table**: Add `is_approved` (boolean, default `false`). When a patient self-registers, their profile is created with `is_approved = false`.

2. **Registration flow update**: After signup, show a message like "Your account has been created and is pending admin approval" instead of redirecting to login.

3. **Login gate**: On login, after authentication succeeds, check `is_approved`. If `false`, show a message: "Your account is pending approval. Please contact the clinic." and sign them out.

4. **Admin approval UI**: In the Admin Patients list, show a "Pending Approval" badge/filter. Add an approve/reject action so admins can activate new accounts.

5. **Invited patients bypass**: Patients created via the admin invite flow should be auto-approved (`is_approved = true`), since the admin already vetted them.

---

### Technical Details

**Database migration:**
- Add `is_approved boolean default false` to `profiles` table
- Update existing profiles to `is_approved = true` (so current users are unaffected)
- Update the invite acceptance flow to set `is_approved = true`

**Files to modify:**

| File | Change |
|------|--------|
| `src/pages/Register.tsx` | After successful signup, show "pending approval" message instead of navigating to `/login` |
| `src/pages/Login.tsx` | After sign-in, query `profiles.is_approved`; if `false`, show toast, sign out, and block access |
| `src/contexts/AuthContext.tsx` | Add `is_approved` to the Profile interface and fetch it with profile data |
| `src/components/auth/ProtectedRoute.tsx` | Check `profile.is_approved` -- if `false`, redirect to a "pending" page or back to login |
| `src/pages/admin/AdminPatients.tsx` | Add a "Pending" status filter/badge; show approve/reject buttons for unapproved accounts |
| `src/pages/admin/PatientDetail.tsx` | Add approve/reject toggle in the Account tab |
| `src/components/admin/PatientAccountTab.tsx` | Show approval status and an approve/reject button |
| `src/pages/InviteLanding.tsx` | On invite acceptance, set `is_approved = true` on the profile |
| `supabase/functions/send-patient-invite/index.ts` | Ensure profiles created via invite are marked `is_approved = true` |

**New file:**
- `src/pages/PendingApproval.tsx` -- Simple page shown to users whose account is not yet approved

**Edge function update (`create-staff`):**
- Staff accounts created by admin should also be auto-approved

