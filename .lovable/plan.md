## Goal

Remove "doctor" from the Staff Management area entirely. Staff is for clinic personnel (admin, nurse) only. Doctors are referrers and continue to be managed exclusively from the Doctors page.

## Changes

### 1. `supabase/functions/list-staff/index.ts`
- Change role filter from `["admin", "nurse", "doctor"]` to `["admin", "nurse"]`.
- Drop the `doctors` table join and the `doctor` field on returned rows.
- Simplify `pickRole` to admin > nurse.

### 2. `supabase/functions/create-staff/index.ts`
- Restrict allowed `role` to `admin | nurse`. Reject `doctor` with a message directing the caller to use the Doctors area.
- Remove the doctors-table insert branch.

### 3. `supabase/functions/update-staff/index.ts` (verify)
- Reject role changes to `doctor`; remove any doctor-record updates.

### 4. `src/hooks/useStaff.ts`
- Update `StaffMember.role` type to `"admin" | "nurse"`.
- Remove the `doctor` sub-object from the type.

### 5. `src/components/admin/staff/StaffFormDialog.tsx`
- Remove the Doctor option from the role select.
- Remove the practice_name / practice_number / specialisation fields and the `isDoctor` branch.
- Default role stays `nurse`.

### 6. `src/pages/admin/AdminStaff.tsx`
- Remove `doctor` from `roleIcons`, `roleColors`, the role filter dropdown, and the header counts line ("X total · Y admin · Z nurse").
- Remove doctor-specific copy in the delete confirmation.

### 7. One-time data note
- No data migration needed: existing doctors in `user_roles` keep their `doctor` role and remain visible/manageable in the Doctors area. They simply stop appearing in Staff. The "doctor test 2" row visible in the screenshot will disappear from Staff after this change.

## Out of scope
- No changes to the Doctors page, doctor invites, or referral flows.
