

Let me explore the current state of treatment courses, appointment types, and the referral flow to understand what's there and what needs building.
<lov-tool-use id="toolu_vrtx_0189CBpDe682AjNCMBX9WVHE" name="code--exec" integration-id="code" data="{\"user_facing_description\": \"Looking at the database schema for treatment-related tables\", \"command\": \"psql -c \\\"\\\\d appointment_types\\\" 2>&1 | head -40 && echo \\\"---\\\" && psql -c \\\"\\\\d treatment_courses\\\" 2>&1 | head -50 && echo \\\"---\\\" && psql -c \\\"\\\\d treatment_protocols\\\" 2>&1 | head -40 && echo \\\"---\\\" && psql -c \\\"\\\\d referrals\\\" 2>&1 | head -50\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CNZwwW4zoStyNwp7JAfUpA" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/doctor/DoctorNewReferral.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01H3RLJpGdkiCSfGrs1ikQoy" name="code--exec" integration-id="code" data="{\"command\": \"psql -c \\\"\\\\d appointment_types\\\" 2>&1 | head -40 && echo \\\"---TC---\\\" && psql -c \\\"\\\\d treatment_courses\\\" 2>&1 | head -50 && echo \\\"---TP---\\\" && psql -c \\\"\\\\d treatment_protocols\\\" 2>&1 | head -40 && echo \\\"---REF---\\\" && psql -c \\\"\\\\d referrals\\\" 2>&1 | head -50\", \"user_facing_description\": \"Looking at the database schema for treatment-related tables\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01X8rZnUv4vd3UCqszLsNPSG" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/doctor/DoctorNewReferral.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Ebwme5e7TKZDkq3egEAs63" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('appointment_types','treatment_courses','treatment_protocols','treatment_protocol_medications','treatment_protocol_steps') ORDER BY table_name, ordinal_position;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DNhvrukZeL5XmdWhVUTrTN" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/settings/AppointmentTypesTab.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_014Z3MafWJqVtK65yL8HQLYV" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/settings/ProtocolConfigTab.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01R362jpWshqSQvmiPqUFVjK" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT name, default_duration_minutes FROM appointment_types WHERE is_active=true ORDER BY display_order; SELECT count(*) as protocol_count FROM treatment_protocols; SELECT name, category FROM form_templates WHERE is_active=true ORDER BY category, display_order;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_012RSBwjjC3TVfqKT9VH9zE2" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/RecurringSessionDialog.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>
I have enough to plan. Let me check the existing FormPackConfigTab and ConvertReferralDialog briefly to understand current wiring, then present the plan.
<lov-tool-use id="toolu_vrtx_019aEwuEYaCojwtauTSJJwvD" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/ConvertReferralDialog.tsx\", \"lines\": \"1-50\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01E38pGHvNBWVJzV3oeGkNJs" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT id, name, treatment_type_id FROM treatment_protocols; SELECT name, required_for_treatment_types FROM form_templates WHERE is_active=true;\"}">
</lov-tool-use>
Good — I have full picture. Existing system already has appointment_types (treatment categories), treatment_protocols (monitoring rules), form_templates with `required_for_treatment_types` (form-pack mapping), and a FormPackConfigTab. What's missing is **course templates** (default sessions / variants per type), **medication variants** (Ferinject vs Venofer vs Monofer for iron), and proper **end-to-end wiring** so that doctor selects type→variant, referral carries it, conversion uses defaults, forms auto-attach.

<lov-plan>

## You're making complete sense. Here's what's there, what's missing, and how to wire it up.

### Where we are today (already built)

| Concept | Implementation | Status |
|---|---|---|
| Treatment types (Iron, Ketamine, Biologic, etc.) | `appointment_types` table + admin UI | ✅ exists |
| Monitoring rules per type | `treatment_protocols` (vitals intervals, observation) + admin UI | ✅ exists |
| Forms required per type | `form_templates.required_for_treatment_types` + Form Pack Config tab | ✅ exists & wired |
| Doctor picks treatment type on referral | Dropdown on `DoctorNewReferral` | ✅ exists |
| Convert referral → treatment course | `ConvertReferralDialog` pre-fills treatment type | ✅ exists |
| Schedule recurring sessions | `RecurringSessionDialog` from course | ✅ exists |
| Auto-create onboarding checklist for required forms when course starts | DB trigger | ✅ exists |

### What's missing (the gaps you've identified)

1. **Course templates with defaults** — there's no "Iron infusion = typically 4 sessions" preset. Gail enters total_sessions every time manually.
2. **Medication variants within a type** — Iron has Ferinject / Venofer / Monofer / CosmoFer. Ketamine has different doses. Biologics has 5 options. Currently all flattened into one "Iron Infusion" type with no sub-selection.
3. **Doctor can't pick the variant** — referral dropdown only shows the parent type, not the sub-option.
4. **Referral → course conversion doesn't carry the variant** — Gail re-enters everything.
5. **Forms don't differentiate by variant** — MonoFer-specific motivation form should attach only when MonoFer is chosen, not for any iron infusion.

### The proposed model (minimal new structure)

Add **one new concept**: `treatment_course_templates`. Think of it as a named recipe per treatment type.

```text
appointment_type (Iron Infusion)
  └─ treatment_course_template (Ferinject — 4 sessions)
  └─ treatment_course_template (Venofer — 6 sessions)
  └─ treatment_course_template (Monofer — 1-2 sessions)
  └─ treatment_course_template (CosmoFer — 1 session)

appointment_type (Ketamine Infusion)
  └─ treatment_course_template (Ketamine Standard — 6 sessions over 2 weeks)
  └─ treatment_course_template (Ketamine Maintenance — monthly)

appointment_type (Biologic)
  └─ treatment_course_template (Infliximab/Remsima — 8 weekly then maintenance)
  └─ treatment_course_template (Rituximab — 2 doses 2 weeks apart)
  └─ ... (3 more)
```

Each template stores: `name`, `appointment_type_id`, `default_sessions`, `default_frequency` (weekly/biweekly/monthly), `default_session_duration_mins`, `description`, `medication_notes`, optional `default_billable_item_ids`, and crucially `required_form_template_ids[]` (overrides the type-level form pack with variant-specific extras like the Monofer motivation form).

### How it wires end-to-end

```text
1. Admin builds templates in Settings → Course Templates
   (Gail fills out each treatment recipe once)

2. Doctor's referral form
   ├─ Treatment Type: [Iron Infusion ▼]
   └─ Treatment Variant: [Ferinject — 4 sessions ▼]   ← NEW dropdown, filtered by type

3. Referral arrives at admin with both type + variant attached
   Admin Triage → Accept → "Convert to Treatment Course" button

4. ConvertReferralDialog now pre-fills from the template:
   - total_sessions = template.default_sessions
   - notes = template.medication_notes + doctor's notes
   - one click to confirm

5. Course is created → DB trigger generates onboarding checklist
   pulling forms from BOTH:
     • appointment_type.required_for_treatment_types (universal type forms)
     • template.required_form_template_ids (variant-specific extras)

6. RecurringSessionDialog pre-fills frequency + session count from the template.

7. Patient gets the right forms in their portal automatically.
```

### Database changes (one migration)

**New table `treatment_course_templates`:**
- `id`, `tenant_id`, `appointment_type_id` (FK), `name`, `description`
- `default_sessions` (int), `default_frequency` (enum: weekly/biweekly/twice_weekly/monthly/single)
- `default_session_duration_mins` (int, nullable — falls back to type's duration)
- `medication_name`, `medication_notes` (text)
- `is_active`, `display_order`
- RLS: admins manage; all authenticated read active rows

**New join `treatment_course_template_forms`:**
- `template_id`, `form_template_id` — extra forms required for this variant only

**Add to `referrals`:** `course_template_id uuid` (nullable)
**Add to `treatment_courses`:** `course_template_id uuid` (nullable, for traceability)

No data migration needed — existing referrals stay valid with template_id null.

### UI changes

| Action | File | Purpose |
|---|---|---|
| Create | `src/components/admin/settings/CourseTemplatesTab.tsx` | CRUD for templates grouped by treatment type |
| Modify | `src/pages/admin/AdminSettings.tsx` | Add "Course Templates" tab |
| Create | `src/hooks/useCourseTemplates.ts` | List/create/update/delete |
| Modify | `src/pages/doctor/DoctorNewReferral.tsx` | Add Variant dropdown (filtered by chosen type) |
| Modify | `src/components/admin/ConvertReferralDialog.tsx` | Read template, pre-fill sessions/notes/duration |
| Modify | `src/hooks/useTreatmentCourses.ts` | Carry `course_template_id` into the new course |
| Modify | DB trigger that creates onboarding checklist | Also pull forms from template's variant list |
| Modify | `src/components/admin/RecurringSessionDialog.tsx` | Default frequency + count from template |
| Modify | `src/components/admin/referrals/ReferralTriageDialog.tsx` | Show variant on details tab |

### Seed data we'll create

To make it usable from day one, we'll pre-create templates for the four most common Gail-runs based on what we already see in your form list:
- **Iron** → Ferinject, Venofer, Monofer, CosmoFer (CosmoFer auto-attaches the Monofer motivation form)
- **Ketamine** → Standard 6-session induction, Monthly maintenance
- **Biologic** → Infliximab/Remsima (auto-attaches Revellex monitoring form), placeholder for the other 4
- **Zoledronic Acid** → Single-session

Gail can edit/extend these immediately.

### What stays the same / no breakage

- Existing referrals, courses, appointments untouched (template_id nullable).
- Form Pack Config tab still works for type-wide forms; templates are additive.
- Existing protocols/monitoring rules unchanged — they already key off treatment type.
- Billing items can later be linked to templates (out of scope this round).

### Out of scope this round (logical next steps)

- Linking default billable items to each template (so invoices auto-populate)
- Per-template patient instructions / preparation notes
- Doctor seeing a "this template is what your patient is on" view in their patient detail
- Versioning of templates (when Gail changes "Ferinject = 4 sessions" to 5, doesn't retroactively change live courses — already safe because we copy values into the course on create)

