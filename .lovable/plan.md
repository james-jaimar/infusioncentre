

## Plan: Admin-Configurable Email Notification Toggles

Create a dedicated "Email Notifications" tab in Admin Settings where Gail can toggle each notification type on/off. Edge Functions and client code check these flags before sending.

### Notification Types

Your 7 plus 3 more I'd recommend:

| # | Key | Direction | Description |
|---|-----|-----------|-------------|
| 1 | `notify_admin_doctor_referral` | → Admin | New doctor referral submitted |
| 2 | `notify_admin_form_completion` | → Admin | Patient completes a form |
| 3 | `notify_admin_patient_update` | → Admin | Patient requests change (cancellation, reschedule, etc.) |
| 4 | `notify_doctor_patient_progress` | → Doctor | Patient status/notes updated by clinic |
| 5 | `notify_patient_portal_invite` | → Patient | New portal invite / login credentials |
| 6 | `notify_patient_treatment_plan` | → Patient | Treatment plan assigned or updated |
| 7 | `notify_patient_schedule_update` | → Patient | Appointment scheduled, changed, or cancelled |
| 8 | `notify_patient_info_request` | → Patient | Clinic requests more info or forms |
| 9 | `notify_patient_new_message` | → Patient | New in-app message from clinic |
| 10 | `notify_doctor_new_message` | → Doctor | New in-app message from clinic |

### What changes

**1. Database migration** — seed the `feature_flags` table with the 10 notification toggles (category: `notifications`, all enabled by default). No new tables needed — reuses the existing `feature_flags` infrastructure.

**2. New hook: `src/hooks/useNotificationPrefs.ts`**
- `useIsNotificationEnabled(key)` — checks `feature_flags` for a specific notification key, returns boolean
- Used by Edge Functions (via direct DB query) and client-side code before invoking `send-email`

**3. New Settings tab: "Email Notifications"**
- `src/components/admin/settings/EmailNotificationsTab.tsx` — filters feature flags by `notifications` category, shows grouped toggle cards (Admin Notifications, Doctor Notifications, Patient Notifications)
- Add tab to `src/pages/admin/AdminSettings.tsx`

**4. Update `send-email` Edge Function**
- Accept optional `notification_key` in payload
- If provided, check `feature_flags` table for that key — if disabled, skip sending and return `{ skipped: true }`
- All existing callers continue working (no key = always send)

**5. Update `submit-public-form` Edge Function**
- Before sending Gail's notification email, check the `notify_admin_form_completion` flag

**6. Update existing email call sites**
- `ReferralTriageDialog.tsx` — pass `notification_key: 'notify_admin_doctor_referral'`
- `useDoctorReports.ts` — pass `notification_key: 'notify_doctor_patient_progress'`
- `useCommunicationLog.ts` — pass appropriate keys based on context

### Implementation order

1. Seed feature flags (migration)
2. Build EmailNotificationsTab + wire into Settings
3. Update `send-email` Edge Function with flag checking
4. Update `submit-public-form` Edge Function with flag checking
5. Update client call sites to pass notification keys

### Technical detail

The flag check happens server-side in the Edge Function using the service role client, so it's secure and can't be bypassed. The admin UI is just a friendly toggle wrapper around the existing `feature_flags` table.

