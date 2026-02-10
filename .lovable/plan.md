

# Phase 5: Billable Items Catalogue and Treatment Billing Foundation

## The Problem

Today the system tracks *what* happens clinically (treatments, vitals, medications) but has no concept of *what to charge for*. There are no prices, no product codes, no way to generate an invoice. Before billing can work, you need a configurable catalogue of "things that cost money" -- drugs, consumables, nursing time, procedures -- that can be linked to treatments and eventually invoiced.

## Design Approach

Rather than trying to build the full invoicing/payments system now (which needs Gail's input on medical aid submissions, ICD-10 coding, tariff structures, etc.), this phase builds the **foundation layer**: a flexible product catalogue that the admin can configure, and the link between treatments and billable items so that when a nurse records a medication or completes a treatment, the system knows what to charge.

Think of it as three layers:

```text
Layer 1: Catalogue (this phase)
  "What can we charge for, and how much?"

Layer 2: Treatment-to-billing link (this phase)
  "When a nurse does X, automatically create a billable line"

Layer 3: Invoicing & payments (future phase)
  "Generate an invoice, submit to medical aid, collect payment"
```

This phase builds Layers 1 and 2. Layer 3 comes later once you have Gail's input on medical aid workflows.

---

## What Gets Built

### 1. Billable Items Catalogue (the "SKU" system)

A new `billable_items` table -- essentially a product/service catalogue. Each item represents something that can appear on an invoice. Fully configurable by admin.

**Fields per item:**
- **Name** -- e.g. "Ketamine 100mg", "Iron Infusion (Venofer 200mg)", "Nursing Hour", "IV Cannulation"
- **Category** -- Drug, Consumable, Procedure, Nursing Fee, Facility Fee (configurable enum)
- **Code** -- Optional NAPPI code (SA drug code), tariff code, or internal SKU
- **Unit** -- e.g. "per vial", "per hour", "per session", "per ml"
- **Default Price** -- Base price in ZAR (can be overridden per invoice line)
- **Cost Price** -- Optional, for margin tracking
- **Track Stock** -- Boolean flag; if true, stock quantity is tracked
- **Stock Quantity** -- Current stock on hand (only relevant if track_stock is true)
- **Reorder Level** -- Optional minimum stock threshold for alerts
- **Linked Appointment Type** -- Optional FK to appointment_types, for auto-suggesting items when a treatment type is selected
- **ICD-10 Code** -- Optional, for medical aid claims
- **Tariff Code** -- Optional, for medical aid billing
- **Active** -- Can be deactivated without deleting

### 2. Treatment Billable Lines

A new `treatment_billable_items` table that records what was actually used/charged during a specific treatment session. When a nurse administers a medication, a corresponding billable line can be created (manually for now, auto-suggested in future).

**Fields per line:**
- Treatment ID (FK)
- Billable Item ID (FK)
- Quantity
- Unit Price (copied from catalogue but editable)
- Total (computed: quantity x unit_price)
- Notes
- Recorded by (nurse/admin user ID)

### 3. Admin UI: Catalogue Management

A new tab in Admin Settings called "Billable Items" where the admin can:
- View all items in a searchable, filterable table
- Add/edit/deactivate items
- Filter by category
- See stock levels for tracked items
- Import items in bulk (future enhancement)

### 4. Nurse Job Card: Billing Panel

A new collapsible section on the Job Card showing:
- Auto-suggested billable items based on the treatment type
- Items added during the session (from medication recording)
- Quick-add button for additional items
- Running total for the session
- This is informational for the nurse -- final billing is handled by admin

---

## Database Changes

### New Enum: billable_item_category
Values: `drug`, `consumable`, `procedure`, `nursing_fee`, `facility_fee`, `other`

### New Table: billable_items

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, NOT NULL | Display name |
| category | billable_item_category | |
| code | text, nullable | NAPPI, tariff, or internal code |
| unit | text | "per vial", "per hour", etc. |
| default_price | decimal(10,2) | Base price in ZAR |
| cost_price | decimal(10,2), nullable | For margin tracking |
| track_stock | boolean, default false | Whether to track inventory |
| stock_quantity | integer, default 0 | Current stock on hand |
| reorder_level | integer, nullable | Alert threshold |
| appointment_type_id | uuid, FK, nullable | Auto-suggest for this treatment type |
| icd10_code | text, nullable | For medical aid claims |
| tariff_code | text, nullable | For medical aid billing |
| is_active | boolean, default true | |
| display_order | integer, default 0 | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### New Table: treatment_billable_items

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| treatment_id | uuid, FK | Links to treatments table |
| billable_item_id | uuid, FK | Links to billable_items |
| quantity | decimal(10,2), default 1 | |
| unit_price | decimal(10,2) | Copied from catalogue, editable |
| notes | text, nullable | |
| recorded_by | uuid, nullable | Staff who added this |
| created_at | timestamptz | |

### RLS Policies

**billable_items:**
- Admins: full CRUD
- Nurses: SELECT only (need to see catalogue to add items during treatment)
- Authenticated users with active types only for general visibility

**treatment_billable_items:**
- Admins: full CRUD
- Nurses: INSERT + SELECT (can add items during treatment and view them)
- Doctors: SELECT on referred patient treatments (same pattern as medications/vitals)

---

## New Files

| File | Purpose |
|---|---|
| supabase/migrations/XXXX_billable_items.sql | Tables, enums, RLS, indexes |
| src/types/billing.ts | TypeScript interfaces for billable items |
| src/hooks/useBillableItems.ts | CRUD hooks for the catalogue |
| src/hooks/useTreatmentBilling.ts | Hooks for treatment billable lines |
| src/pages/admin/AdminBillableItems.tsx | Full catalogue management page |
| src/components/nurse/JobCardBilling.tsx | Billing panel on the Job Card |

## Modified Files

| File | Change |
|---|---|
| src/pages/admin/AdminSettings.tsx | Add "Billable Items" tab linking to the new page, or integrate inline |
| src/pages/nurse/NurseJobCard.tsx | Add the billing panel component |
| src/App.tsx | Add route for admin billable items page (if standalone) |
| src/components/layout/AdminLayout.tsx | Add sidebar link if standalone page |

---

## Implementation Order

1. Database migration -- billable_items table, treatment_billable_items table, enum, RLS, foreign keys
2. TypeScript types and CRUD hooks for billable items
3. Admin catalogue management UI (new tab in Settings or standalone page)
4. Treatment billing hooks (linking items to treatments)
5. Nurse Job Card billing panel (view and add billable items during treatment)
6. Seed some example items based on known JIC treatment types (Ketamine, Iron variants, biologics, nursing fees)

---

## Technical Notes

- The `billable_items` table is intentionally flexible -- it covers drugs, consumables, time-based fees, and flat-rate procedures. This avoids needing separate tables for each category.
- Stock tracking is opt-in per item. Most services (nursing time, facility fees) won't track stock, but drugs and consumables can.
- The `appointment_type_id` link on billable items enables auto-suggestion: when a Ketamine treatment starts, the system can pre-populate suggested items (Ketamine vial, IV line, nursing fee, etc.).
- Prices are in ZAR (South African Rand) to match the clinic's location.
- The `treatment_billable_items` table stores the actual price at time of use, not a reference to the catalogue price. This means historical invoices remain accurate even if catalogue prices change.
- ICD-10 and tariff code fields are optional placeholders for the future medical aid billing integration. They can be populated once Gail provides the specific codes used.
- This design is compatible with the billing foundation memory note (subtotal, tax, total, medical aid claim, patient liability) -- those invoice-level fields will be added in the invoicing phase.
