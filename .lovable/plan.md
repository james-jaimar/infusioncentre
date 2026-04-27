## Problem

Logging in as `nurse1@company.com` routes to the patient portal instead of the nurse Command Centre.

### Root Cause

That user has **two rows** in `user_roles`:

```
nurse1@company.com → [patient (older), nurse (newer)]
```

The `handle_new_user` trigger inserts a `'patient'` row for every new auth user. When `create-staff` later changed the role to `'nurse'`, a second row was created instead of replacing the first (likely due to a race with the trigger, or a prior version of the function).

`AuthContext.fetchUserData` queries `user_roles` with `ORDER BY created_at ASC LIMIT 1`, so it picks `'patient'` and routes to `/patient`.

(Note: `admin@jaimar.dev` correctly has role `doctor` — that account is intentionally a doctor test login, no fix needed there.)

## Fix

### 1. Data cleanup migration

Remove the orphan `'patient'` row for any user who also has a staff role. This corrects the existing nurse and any other affected staff accounts without touching real patients.

```sql
DELETE FROM public.user_roles ur
WHERE ur.role = 'patient'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id
      AND ur2.role IN ('admin','nurse','doctor')
  );
```

### 2. Make `create-staff` deterministic

Replace the brittle `.update()` on `user_roles` with `delete-then-insert`, so a new staff member always ends up with exactly one role row regardless of what the trigger left behind.

```ts
await adminClient.from("user_roles").delete().eq("user_id", userId);
await adminClient.from("user_roles").insert({ user_id: userId, role, tenant_id });
```

### 3. Defence-in-depth in `AuthContext`

Update `fetchUserData` so that if a user somehow has multiple role rows again, staff roles take precedence over `patient`:

```ts
const { data } = await supabase
  .from("user_roles").select("role").eq("user_id", userId);
const roles = (data ?? []).map(r => r.role);
const role =
     (roles.includes('admin')   && 'admin')
  || (roles.includes('nurse')   && 'nurse')
  || (roles.includes('doctor')  && 'doctor')
  || (roles.includes('patient') && 'patient')
  || null;
```

### 4. Apply same precedence in `list-staff`

So the staff console always shows the highest-priority role per user.

## Files Changed

- New migration: `supabase/migrations/<timestamp>_dedupe_staff_roles.sql`
- `supabase/functions/create-staff/index.ts` — delete-then-insert role row
- `supabase/functions/list-staff/index.ts` — role precedence
- `src/contexts/AuthContext.tsx` — role precedence in `fetchUserData`

## Verification

1. Log in as `nurse1@company.com` → lands on `/nurse` Command Centre.
2. Log in as `admin@jaimar.dev` → still lands on `/doctor` (unchanged).
3. Log in as `gayle@infusioncentre.co.za` / `james@jaimar.dev` → still lands on `/admin`.
4. Create a new nurse via the staff console → exactly one `user_roles` row, login routes to `/nurse`.
