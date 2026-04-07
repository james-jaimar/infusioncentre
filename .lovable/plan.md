

## Plan: Fix "Failed to update mode" — Add `facsimile` to CHECK Constraint

### Root Cause

The database has a CHECK constraint on `form_templates.render_mode` that only allows `'schema'` and `'pdf_overlay'`. The value `'facsimile'` is rejected by Postgres, causing the "Failed to update mode" error.

### Fix

**Database migration**: Drop and recreate the CHECK constraint to include `facsimile`:

```sql
ALTER TABLE form_templates DROP CONSTRAINT form_templates_render_mode_check;
ALTER TABLE form_templates ADD CONSTRAINT form_templates_render_mode_check
  CHECK (render_mode = ANY (ARRAY['schema', 'pdf_overlay', 'facsimile']));
```

No code changes needed — the UI already works correctly, it's just the database rejecting the value.

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/` (new) | Update CHECK constraint to allow `facsimile` |

