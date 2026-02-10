

# Phase 6: Enhanced Clinical Monitoring for Nurse Treatment Screens

## The Problem

The current treatment screens capture basic vitals (BP, HR, O2, temp, weight) and medications (name, dosage, route, lot number). This is a good start, but falls significantly short of what nurses are legally and clinically required to document during infusion therapy. Based on the Infusion Nurses Society (INS) Standards of Practice, the ACHC Clinical Documentation Expectations, and SA nursing scope of practice under SANC regulations, there are several critical gaps.

## What's Missing Today

### 1. IV Site / Vascular Access Documentation
Currently not captured at all. Nurses must document:
- Cannula gauge and length
- Insertion site location (e.g., "right dorsal hand, cephalic vein")
- Number of insertion attempts
- Site condition at each assessment (redness, swelling, pain, infiltration, phlebitis)
- Dressing type applied
- Flush details (solution, volume)
- Site removal documentation (time, condition, catheter integrity)

### 2. Infusion Administration Details
The medication recording captures name/dosage/route but misses:
- Diluent type and volume (e.g., "in 250ml Normal Saline")
- Infusion rate (ml/hr) and method (continuous, intermittent, bolus)
- Start and stop times for each medication (not just "administered at")
- Pump settings used
- Pre- and post-infusion site assessment

### 3. Reaction / Adverse Event Monitoring
No structured way to document:
- Infusion reaction grading (Grade 1-4 per CTCAE scale)
- Specific symptoms observed (flushing, rigors, urticaria, dyspnoea, hypotension, chest pain)
- Time of onset relative to infusion start
- Interventions taken (rate reduced, infusion paused, medications given)
- Outcome of intervention
- Whether infusion was resumed, at what rate, or permanently stopped

### 4. Respiratory Rate
A core vital sign that's missing from the vitals panel entirely. Standard monitoring requires: BP, HR, RR, O2 Sat, Temp. Respiratory rate is particularly important for detecting anaphylaxis and infusion reactions.

### 5. Pain Assessment
No structured pain scoring during treatment (separate from the Ketamine-specific pain score). Standard nursing practice uses a 0-10 numerical rating scale at each vitals check.

### 6. Fluid Balance
For longer infusions, total fluid input needs tracking (volume infused). This is currently not captured.

### 7. Consent and Allergy Verification Timestamps
The pre-treatment checklist records that these were done, but doesn't capture WHO verified, WHEN, or the specific allergies confirmed with the patient.

---

## What Gets Built

### Database Changes

**Add columns to `treatment_vitals`:**
- `respiratory_rate` (integer, nullable) -- the missing core vital sign
- `pain_score` (integer, nullable) -- 0-10 NRS scale

**New table: `treatment_iv_access`**
Records vascular access device details per treatment session:
- `treatment_id` (FK)
- `access_type` (enum: peripheral, midline, picc, port, central)
- `gauge` (text, e.g., "22G", "20G")
- `site_location` (text, e.g., "right dorsal hand, cephalic vein")
- `insertion_attempts` (integer)
- `inserted_at` (timestamptz)
- `inserted_by` (uuid, FK)
- `dressing_type` (text)
- `flush_solution` (text, e.g., "10ml NS")
- `removed_at` (timestamptz, nullable)
- `removal_site_condition` (text, nullable)
- `notes` (text, nullable)

**New table: `treatment_site_checks`**
Periodic IV site assessments during treatment (INS requires at minimum every hour, more frequently for high-risk infusions):
- `treatment_id` (FK)
- `iv_access_id` (FK to treatment_iv_access)
- `checked_at` (timestamptz)
- `checked_by` (uuid)
- `site_appearance` (text[] -- array of: normal, redness, swelling, pain, warmth, leaking, hardness)
- `phlebitis_grade` (integer, 0-4, nullable)
- `infiltration_grade` (integer, 0-4, nullable)
- `action_taken` (text, nullable -- e.g., "site changed", "dressing changed", "none")
- `notes` (text, nullable)

**New table: `treatment_reactions`**
Documents adverse/infusion reactions:
- `treatment_id` (FK)
- `onset_at` (timestamptz)
- `onset_minutes_from_start` (integer)
- `severity_grade` (integer, 1-4 -- CTCAE grading)
- `symptoms` (text[] -- array of: flushing, rigors, urticaria, pruritus, dyspnoea, wheezing, chest_pain, hypotension, hypertension, tachycardia, nausea, vomiting, fever, headache, back_pain, other)
- `other_symptoms` (text, nullable)
- `intervention` (text[] -- array of: rate_reduced, infusion_paused, infusion_stopped, antihistamine, corticosteroid, adrenaline, oxygen, iv_fluids, other)
- `intervention_details` (text, nullable)
- `infusion_resumed` (boolean, nullable)
- `resumed_at_rate` (text, nullable)
- `outcome` (text -- resolved, ongoing, escalated, emergency_transfer)
- `resolved_at` (timestamptz, nullable)
- `recorded_by` (uuid)
- `notes` (text, nullable)

**Add columns to `treatment_medications`:**
- `diluent` (text, nullable -- e.g., "250ml Normal Saline")
- `infusion_rate` (text, nullable -- e.g., "125 ml/hr")
- `infusion_method` (text, nullable -- continuous, intermittent, bolus, push)
- `started_at` (timestamptz, nullable -- rename logic: `administered_at` stays as the timestamp the record was made; `started_at` is when infusion actually began)
- `stopped_at` (timestamptz, nullable)
- `volume_infused_ml` (numeric, nullable)
- `site_assessment_pre` (text, nullable -- site condition before starting this medication)
- `site_assessment_post` (text, nullable -- site condition after)

### UI Changes

**1. Enhanced Vitals Recording Dialog**
Add respiratory rate and pain score fields to the vitals recording dialog in `JobCardVitals.tsx`. These appear alongside the existing BP/HR/O2/Temp fields.

**2. IV Access Panel (new component: `JobCardIVAccess.tsx`)**
Positioned on the Job Card between the pre-treatment checklist and vitals. Shows:
- Current IV access details (gauge, site, insertion time)
- Quick "Add IV Access" dialog for documenting cannulation
- Periodic site check button with a symptom picker (checkboxes for redness, swelling, pain, etc.)
- Phlebitis and infiltration grading scales (visual 0-4 scale)
- History of all site checks in a compact timeline
- Visual alert if site check is overdue (configurable interval, default 60 minutes)

**3. Reaction Alert Panel (new component: `JobCardReactions.tsx`)**
A prominent panel on the Job Card for documenting adverse reactions:
- Large "Report Reaction" button (always visible during active treatment, styled as a warning)
- Reaction recording dialog with:
  - Severity grade selector (1-4 with descriptions)
  - Symptom multi-select checkboxes
  - Intervention checklist
  - Free-text details
  - Outcome tracking
- History of any reactions during this session
- Links to Emergency Protocol page

**4. Enhanced Medication Recording**
Update `JobCardMedications.tsx` to include the new fields:
- Diluent type and volume
- Infusion rate
- Method (dropdown: continuous, intermittent, bolus, IV push)
- Start/stop time tracking with a "Stop Infusion" action
- Volume infused

**5. Site Check Reminder**
A subtle timer/badge on the IV Access panel that shows time since last site check. Turns amber at 45 minutes, red at 60 minutes. This is a visual prompt, not a blocking alert.

---

## Files to Create

| File | Purpose |
|---|---|
| `supabase/migrations/XXXX_clinical_monitoring.sql` | New tables, columns, enums, RLS |
| `src/components/nurse/JobCardIVAccess.tsx` | IV access documentation and site checks |
| `src/components/nurse/JobCardReactions.tsx` | Adverse reaction recording panel |
| `src/hooks/useIVAccess.ts` | CRUD hooks for IV access and site checks |
| `src/hooks/useTreatmentReactions.ts` | CRUD hooks for reaction documentation |

## Files to Modify

| File | Change |
|---|---|
| `src/types/treatment.ts` | Add interfaces for IV access, site checks, reactions; update TreatmentVitals and TreatmentMedication |
| `src/integrations/supabase/types.ts` | Will auto-update after migration |
| `src/components/nurse/JobCardVitals.tsx` | Add respiratory rate and pain score to recording dialog and display |
| `src/components/nurse/JobCardMedications.tsx` | Add diluent, rate, method, start/stop, volume fields |
| `src/pages/nurse/NurseJobCard.tsx` | Add IV Access and Reactions panels to the layout |
| `src/hooks/useTreatments.ts` | Update vitals mutation to include new fields |

---

## Implementation Order

1. **Database migration** -- new tables (`treatment_iv_access`, `treatment_site_checks`, `treatment_reactions`), new columns on `treatment_vitals` and `treatment_medications`, RLS policies
2. **TypeScript types** -- update `treatment.ts` with new interfaces
3. **Vitals enhancement** -- add respiratory rate and pain score to recording and display
4. **Medication enhancement** -- add diluent, rate, method, volume, start/stop fields
5. **IV Access panel** -- new component with access documentation and site checks
6. **Reaction panel** -- new component for adverse event recording
7. **Job Card integration** -- wire new panels into the main Job Card layout
8. **Site check timer** -- visual reminder for overdue site assessments

---

## Technical Notes

- **All new tables follow existing RLS patterns**: admins full CRUD, nurses INSERT + SELECT, doctors SELECT for referred patients.
- **The `treatment_assessments` JSONB table could technically store some of this**, but structured tables are better here because: (a) these are legally required records that need to be queryable and reportable, (b) they need proper foreign keys and constraints, (c) future reporting/auditing will need to query across all treatments for reaction rates, phlebitis incidence, etc.
- **Reaction grading follows CTCAE v5.0** (Common Terminology Criteria for Adverse Events), which is the international standard used by infusion therapy units.
- **Phlebitis grading follows the VIP (Visual Infusion Phlebitis) scale** (0-4), which is the standard assessment tool for IV site monitoring.
- **The site check timer is client-side only** -- it calculates time since the last `treatment_site_checks` record. No server-side scheduled tasks needed.
- **Existing screens are preserved** -- `NurseActiveTreatment.tsx`, `NurseCheckIn.tsx`, and `NurseDischarge.tsx` remain functional but are secondary to the Job Card. They will not receive these enhancements (the Job Card is the primary workflow going forward).

