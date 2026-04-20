

## Add "Other / Custom" treatment type for doctor referrals

Lets doctors submit a referral when the exact treatment isn't yet configured. Gail then decides on triage whether to handle it ad-hoc or promote it into a real treatment type / course template.

### 1. Seed an "Other" appointment type

New row in `appointment_types`:

| Field | Value |
|---|---|
| name | `Other / Custom` |
| service_category | `care_pathway` (ongoing, no fixed sessions) |
| default_duration_minutes | 60 |
| color | `#6B7280` (neutral grey — visually flags it as "not standard") |
| display_order | 999 (always last) |
| is_active | true |
| requires_consent | false |

Idempotent guard (skip if already exists), same pattern as the Stoma / Wound Care migrations.

No course templates seeded — the whole point is that the doctor describes it free-text. Gail can add templates later if it becomes recurring.

### 2. Doctor referral form behaviour

In `DoctorNewReferral` (and `FollowUpReferralDialog`), when the doctor picks **Other / Custom** from the Treatment Type dropdown:

- Reveal a required **"Describe the requested treatment"** textarea (3 rows) directly under the dropdown.
- On submit, prepend `[OTHER / CUSTOM]` to the existing `treatment_requested` field so it's instantly visible in the admin referral queue (no schema change needed — reuses the existing column).
- Helper text under the dropdown: *"Use this if the treatment you need isn't listed. Our team will contact you to confirm."*

### 3. Admin triage surface

In `ReferralTable` and `ReferralTriageDialog`:

- When the referral's `treatment_type_id` matches the "Other / Custom" type, render a small amber **"Custom request"** badge next to the patient name so Gail spots it immediately.
- In the triage dialog, show the doctor's free-text description in a highlighted callout block (amber-tinted card) above the existing notes field.

### 4. Convert-to-course flow

In `ConvertReferralDialog`, when the source referral is "Other / Custom":

- Skip the "pick a course template" step (no templates exist for this type).
- Offer two clear paths via radio buttons:
  - **Handle as ad-hoc billable item** — closes the dialog, returns Gail to the patient's billing tab with a toast: *"Add the work as line items on the next invoice."*
  - **Create a new treatment type from this** — opens the Course Templates settings page in a new tab pre-filled with the doctor's description (via URL query params `?from_referral=<id>&name=<text>`), so Gail can formalise it once and then convert.

### 5. Settings tab — small affordance

In `CourseTemplatesTab`, when the URL has `?from_referral=...`, auto-open the "New Treatment Type" editor with the name pre-filled and a small banner: *"Creating from referral #<short-id>"*. This closes the loop without forcing Gail to retype.

### Files

| File | Change |
|---|---|
| New `supabase/migrations/<ts>_other_custom_type_seed.sql` | Insert the "Other / Custom" appointment type (idempotent) |
| `src/pages/doctor/DoctorNewReferral.tsx` | Conditional textarea + helper text when "Other" is selected; prepend tag on submit |
| `src/components/doctor/FollowUpReferralDialog.tsx` | Same conditional textarea behaviour |
| `src/components/admin/referrals/ReferralTable.tsx` | "Custom request" badge for Other-type referrals |
| `src/components/admin/referrals/ReferralTriageDialog.tsx` | Amber callout showing the free-text description |
| `src/components/admin/ConvertReferralDialog.tsx` | Branch for Other-type: ad-hoc vs promote-to-type |
| `src/components/admin/settings/CourseTemplatesTab.tsx` | Read `?from_referral` / `?name` query params and auto-open type editor |

### What stays the same
- No schema changes — reuses existing `treatment_requested` text column for the description.
- All hooks/types already support `care_pathway` + `as_needed` from the previous Stoma/Wound work.
- Course templates remain empty for "Other" by design.

