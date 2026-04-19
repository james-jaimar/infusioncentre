

## Add "Wound Care" as care pathway service

Same pattern as Stoma Therapy — pure data seed, no schema or code changes.

### Migration: seed Wound Care + starter templates

**Appointment type**
- Name: `Wound Care`
- `service_category`: `care_pathway`
- Duration: 45 min, color e.g. `#B85C5C` (clinical clay)
- `display_order`: 110 (after Stoma at 100)

**Starter templates** (all `as_needed` frequency, single session each, ongoing courses)

| # | Template | Duration | Purpose |
|---|---|---|---|
| 0 | Initial Wound Assessment | 60 min | First visit: wound measurement, photo, baseline TIME assessment, dressing plan |
| 1 | Dressing Change | 30 min | Routine dressing change, cleansing, reassessment |
| 2 | Wound Review | 45 min | Periodic progress review, photo, plan adjustment |
| 3 | Compression Therapy | 45 min | Application/replacement of compression bandaging (venous ulcers) |
| 4 | Discharge / Healed Review | 30 min | Final review when wound healed; education on prevention |

Idempotent (skip if Wound Care already exists, skip templates if any already linked) — same guard pattern as the Stoma migration.

### What stays the same
- All UI (CourseTemplatesTab already renders care pathways with the badge, ongoing chip, as_needed handling)
- All hooks/types (already support `care_pathway` + `as_needed`)
- No frontend changes needed

### Files
| File | Change |
|---|---|
| New migration `supabase/migrations/<ts>_wound_care_seed.sql` | Insert appointment type + 5 templates |

After this, Gail can edit/rename/add/delete the wound care templates from Settings → Course Templates exactly like Stoma.

