

## Fix: Admin Tools to Recover Stuck Invited Accounts

### The Problem

When a patient registers via an invite link, the "accept" edge function call can silently fail (network issues, timing, etc.), leaving the system in a broken state:
- Auth user exists with `is_approved = false` (stuck on "Pending Approval" screen)
- Patient record has no `user_id` linked (admin sees "No Account")
- No admin tool exists to fix this manually

### Solution

Add admin capabilities to the **Account tab** to detect and resolve this situation, plus make the invite acceptance more resilient.

### Changes

**1. PatientAccountTab.tsx -- Add "Link & Approve" functionality**

When a patient shows "No Account" but has an email on file, add a button to search for an existing auth user with that email and link them:
- Query auth users by email (via a small edge function)
- If found, update `patients.user_id` and set `profiles.is_approved = true`
- Show the result immediately

**2. New edge function action in `send-patient-invite`**

Add a `link-account` admin action that:
- Takes `patient_id` and `email`
- Looks up the auth user by email using the admin API
- Updates `patients.user_id`, sets `profiles.is_approved = true`
- Marks any pending invites as "accepted"
- Requires admin/nurse role

**3. InviteLanding.tsx -- Better error handling**

If the accept call fails after signup, retry once and show a clearer message rather than silently navigating to `/patient` where the user gets stuck.

### Technical Details

**Edge function update (`send-patient-invite`):**

New `link-account` action (admin-only):
```
POST { action: "link-account", patient_id: "...", email: "..." }
```
- Uses `adminClient.auth.admin.listUsers()` to find user by email
- Updates `patients.user_id` to the found auth user ID
- Sets `profiles.is_approved = true`
- Marks pending invites as accepted

**PatientAccountTab.tsx changes:**
- When `hasAccount` is false but `patientEmail` exists, show a "Link Existing Account" button
- On click, calls the new `link-account` action
- On success, invalidates queries so the UI refreshes to show the linked account with approval controls

**InviteLanding.tsx changes:**
- Add error handling around the accept call -- if it fails, show a message telling the user to contact the clinic rather than navigating to a portal they can't access
- Add a retry mechanism for the edge function call

**Files to modify:**
| File | Change |
|------|--------|
| `supabase/functions/send-patient-invite/index.ts` | Add `link-account` admin action |
| `src/components/admin/PatientAccountTab.tsx` | Add "Link Existing Account" button for orphaned accounts |
| `src/pages/InviteLanding.tsx` | Better error handling when accept fails |

