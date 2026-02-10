

# Full Admin CRUD Implementation

## Overview

Add complete Create, Read, Update, and Delete capabilities across all admin-managed areas. Staff management is the biggest gap (currently read-only), but several other areas also need CRUD enhancements.

---

## 1. Staff Management -- Full CRUD

The staff page currently only lists staff and directs users to the Supabase dashboard to add new members. We will build full in-app management.

### 1A. Create Staff Member

- Add an "Add Staff" button to `AdminStaff.tsx`
- Dialog form with fields: First Name, Last Name, Phone, Email, Password, Role (Admin/Nurse)
- Uses Supabase Edge Function `create-staff` to:
  - Call `supabase.auth.admin.createUser()` with the provided email/password (requires service role key)
  - Insert into `profiles` table
  - Insert into `user_roles` table
- This avoids exposing the service role key on the client

### 1B. Edit Staff Member

- Add an "Edit" button on each staff card
- Dialog form to update: First Name, Last Name, Phone, Role
- Updates `profiles` table and `user_roles` table via client SDK (admin RLS policies already allow this)

### 1C. Delete/Deactivate Staff

- Add a "Remove" button with confirmation dialog
- Deletes the `user_roles` entry and optionally the `profiles` entry
- Does NOT delete the auth user (that would need the edge function); instead marks them as removed from staff view

### Files:
- **Create:** `supabase/functions/create-staff/index.ts` (new Edge Function)
- **Modify:** `src/pages/admin/AdminStaff.tsx` (add Create/Edit/Delete dialogs)

---

## 2. Training Courses -- Admin CRUD

Currently there is no admin UI to manage training courses (the `training_courses` table). Admins can only see bookings.

### Changes:
- Add a "Courses" tab to `AdminTraining.tsx` (alongside the existing Bookings tab)
- Full CRUD for courses: Name, Description, Duration, Price, Max Participants, Includes list, Active toggle
- Table view with Edit and Delete actions
- New hook: `src/hooks/useTrainingCourses.ts` -- add mutation hooks (currently only has a read query)

### Files:
- **Modify:** `src/pages/admin/AdminTraining.tsx` (add Courses tab with CRUD)
- **Modify:** `src/hooks/useTrainingCourses.ts` (add create/update/delete mutations)

---

## 3. Training Bookings -- Complete CRUD

Currently bookings only support status changes. We need:
- **Edit:** Click a booking row to open a detail dialog with editable fields (participant name, email, phone, organisation, preferred dates, notes)
- **Delete:** Add delete button with confirmation

### Files:
- **Modify:** `src/pages/admin/AdminTraining.tsx` (add edit dialog and delete action to bookings)

---

## 4. Contact Submissions -- Add Delete

Contacts currently support status updates and notes but not deletion.
- Add a delete button in the detail dialog with confirmation
- Uses existing admin DELETE RLS policy on `contact_submissions`

### Files:
- **Modify:** `src/pages/admin/AdminContacts.tsx` (add delete button in dialog)

---

## 5. Appointments -- Full Edit Capability

The appointment detail page only allows status changes. We need full field editing:
- Edit scheduled date/time, chair assignment, nurse assignment, appointment type, and notes
- Add an "Edit" mode to `AppointmentDetail.tsx` similar to PatientDetail's edit pattern

### Files:
- **Modify:** `src/pages/admin/AppointmentDetail.tsx` (add inline edit mode for all fields)

---

## Technical Details

### New Edge Function: `supabase/functions/create-staff/index.ts`

This function is needed because creating auth users requires the service role key, which cannot be exposed to the client.

```text
Endpoint: POST /create-staff
Body: { email, password, first_name, last_name, phone, role }
Auth: Validates caller is admin via JWT
Process:
  1. Verify caller has admin role
  2. Create auth user via supabase.auth.admin.createUser()
  3. Insert profile record
  4. Insert user_roles record
  5. Return created user data
```

### Hook Changes

**`src/hooks/useTrainingCourses.ts`** -- Add:
- `useCreateTrainingCourse()` mutation
- `useUpdateTrainingCourse()` mutation
- `useDeleteTrainingCourse()` mutation

### No Database Migrations Required

All existing tables and RLS policies already support the needed operations:
- `profiles`: Admin can update all profiles (existing policy)
- `user_roles`: Admin can insert, update, delete roles (existing policies)
- `contact_submissions`: Admin can delete (existing policy)
- `course_bookings`: Admin can manage all (existing ALL policy)
- `training_courses`: Admin can manage all (existing ALL policy)
- `appointments`: Admin can update all fields (existing policy)

### Implementation Sequence

1. Create `create-staff` Edge Function and deploy
2. Rebuild `AdminStaff.tsx` with full CRUD (create/edit/delete dialogs)
3. Add training course management to `AdminTraining.tsx`
4. Enhance training bookings with edit/delete
5. Add delete to `AdminContacts.tsx`
6. Add full edit mode to `AppointmentDetail.tsx`
7. Update training courses hook with mutations

