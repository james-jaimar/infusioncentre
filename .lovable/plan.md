# Fix: Nurse cannot start treatment

## Root cause

The `public.treatments` table has a trigger `update_treatments_updated_at` that runs `NEW.updated_at = now()` on every UPDATE. But the `treatments` table has no `updated_at` column, so every update (including the nurse's "Start Treatment" status change to `in_progress`) fails with:

> record "new" has no field "updated_at"

This is why the PATCH to `/rest/v1/treatments?id=eq...` returns 400, and the toast shows the error.

## Fix

Add the missing `updated_at` column to `public.treatments` so the existing trigger works correctly (matches the convention used on other tables in this project).

### Migration

```sql
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
```

That's it. No code changes required — the trigger will then populate it on every update, and the nurse's "Start Treatment" action will succeed.

## Notes on the other console messages (not bugs to fix)

- `postMessage … target origin 'https://lovable.dev'` — Lovable preview iframe noise, harmless.
- `patients?...user_id=eq.<nurse_uuid>` returning 406 — expected; the nurse has no patient row, the query just returned no rows.
- `vitals_thresholds?...protocol_id=eq.` (empty) — separate minor issue: a query is firing with an empty protocol_id. Not blocking the workflow; can be addressed separately if it causes UI problems.

I'll only do the migration above in this pass.