export type BillableItemCategory = 'drug' | 'consumable' | 'procedure' | 'nursing_fee' | 'facility_fee' | 'other';

export interface BillableItem {
  id: string;
  name: string;
  category: BillableItemCategory;
  code: string | null;
  unit: string;
  default_price: number;
  cost_price: number | null;
  track_stock: boolean;
  stock_quantity: number;
  reorder_level: number | null;
  appointment_type_id: string | null;
  icd10_code: string | null;
  tariff_code: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TreatmentBillableItem {
  id: string;
  treatment_id: string;
  billable_item_id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  billable_item?: BillableItem;
}

export const BILLABLE_CATEGORIES: { value: BillableItemCategory; label: string }[] = [
  { value: 'drug', label: 'Drug' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'nursing_fee', label: 'Nursing Fee' },
  { value: 'facility_fee', label: 'Facility Fee' },
  { value: 'other', label: 'Other' },
];
