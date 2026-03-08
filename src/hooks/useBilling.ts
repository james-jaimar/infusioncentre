import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ───

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  treatment_course_id: string | null;
  status: "draft" | "finalized" | "submitted" | "partially_paid" | "paid" | "void";
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_outstanding: number;
  payer_name: string | null;
  payer_type: string | null;
  medical_aid_name: string | null;
  medical_aid_number: string | null;
  notes: string | null;
  issued_date: string;
  due_date: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  patients?: { first_name: string; last_name: string; email: string | null; medical_aid_name: string | null; medical_aid_number: string | null };
  treatment_courses?: { status: string; appointment_types?: { name: string } } | null;
  invoice_line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  billable_item_id: string | null;
  treatment_billable_item_id: string | null;
  description: string;
  code: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  tariff_code: string | null;
  icd10_code: string | null;
  created_at: string;
}

export interface BillingClaim {
  id: string;
  invoice_id: string;
  claim_reference: string | null;
  payer_name: string;
  status: "draft" | "submitted" | "accepted" | "rejected" | "appealed" | "partially_paid" | "paid" | "written_off";
  submitted_amount: number;
  approved_amount: number | null;
  paid_amount: number;
  rejection_reason: string | null;
  rejection_code: string | null;
  submitted_at: string | null;
  response_at: string | null;
  paid_at: string | null;
  appeal_notes: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  invoices?: { invoice_number: string; patient_id: string; total_amount: number; patients?: { first_name: string; last_name: string } };
}

export interface PayerRateMapping {
  id: string;
  payer_name: string;
  billable_item_id: string;
  contracted_rate: number;
  effective_from: string;
  effective_to: string | null;
  is_claimable: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  billable_items?: { name: string; code: string | null };
}

// ─── Invoices ───

export function useInvoices(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select(`
          *,
          patients!invoices_patient_id_fkey(first_name, last_name, email, medical_aid_name, medical_aid_number),
          treatment_courses!invoices_treatment_course_id_fkey(status, appointment_types:treatment_type_id(name))
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }
      if (filters?.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,payer_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          patients!invoices_patient_id_fkey(first_name, last_name, email, medical_aid_name, medical_aid_number),
          treatment_courses!invoices_treatment_course_id_fkey(status, appointment_types:treatment_type_id(name)),
          invoice_line_items(*)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!id,
  });
}

export function useGenerateInvoiceNumber() {
  return useQuery({
    queryKey: ["next_invoice_number"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("generate_invoice_number");
      if (error) throw error;
      return data as string;
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      invoice: Partial<Invoice>;
      lineItems: Omit<InvoiceLineItem, "id" | "invoice_id" | "line_total" | "created_at">[];
    }) => {
      // Calculate totals
      const subtotal = params.lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);
      const total = subtotal - (params.invoice.discount_amount || 0) + (params.invoice.tax_amount || 0);

      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          ...params.invoice,
          subtotal,
          total_amount: total,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Insert line items
      if (params.lineItems.length > 0) {
        const lines = params.lineItems.map((li) => ({
          ...li,
          invoice_id: invoice.id,
        }));
        const { error: lineErr } = await supabase
          .from("invoice_line_items")
          .insert(lines as any[]);
        if (lineErr) throw lineErr;
      }

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// Generate invoice from treatment course billable items
export function useGenerateInvoiceFromCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      treatmentCourseId: string;
      patientId: string;
      invoiceNumber: string;
    }) => {
      // Fetch all treatment_billable_items linked to treatments in this course's appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id")
        .eq("treatment_course_id", params.treatmentCourseId);

      if (!appointments?.length) throw new Error("No appointments found for this course");

      // Get treatments for these appointments
      const { data: treatments } = await supabase
        .from("treatments")
        .select("id")
        .in("appointment_id", appointments.map((a: any) => a.id));

      if (!treatments?.length) throw new Error("No treatments found");

      const { data: billableItems } = await supabase
        .from("treatment_billable_items")
        .select("*, billable_item:billable_items(*)")
        .in("treatment_id", treatments.map((t: any) => t.id));

      if (!billableItems?.length) throw new Error("No billable items found");

      // Get patient medical aid info
      const { data: patient } = await supabase
        .from("patients")
        .select("medical_aid_name, medical_aid_number")
        .eq("id", params.patientId)
        .single();

      const lineItems = billableItems.map((bi: any) => ({
        billable_item_id: bi.billable_item_id,
        treatment_billable_item_id: bi.id,
        description: bi.billable_item?.name || "Item",
        code: bi.billable_item?.code || null,
        quantity: bi.quantity,
        unit_price: bi.unit_price,
        tariff_code: bi.billable_item?.tariff_code || null,
        icd10_code: bi.billable_item?.icd10_code || null,
      }));

      const subtotal = lineItems.reduce((s: number, li: any) => s + li.quantity * li.unit_price, 0);

      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: params.invoiceNumber,
          patient_id: params.patientId,
          treatment_course_id: params.treatmentCourseId,
          subtotal,
          total_amount: subtotal,
          medical_aid_name: patient?.medical_aid_name,
          medical_aid_number: patient?.medical_aid_number,
          payer_type: patient?.medical_aid_name ? "medical_aid" : "patient",
          payer_name: patient?.medical_aid_name || "Patient",
        } as any)
        .select()
        .single();
      if (error) throw error;

      const lines = lineItems.map((li: any) => ({ ...li, invoice_id: invoice.id }));
      const { error: lineErr } = await supabase.from("invoice_line_items").insert(lines as any[]);
      if (lineErr) throw lineErr;

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice generated from treatment course");
    },
  });
}

// ─── Billing Claims ───

export function useBillingClaims(filters?: { status?: string }) {
  return useQuery({
    queryKey: ["billing_claims", filters],
    queryFn: async () => {
      let query = supabase
        .from("billing_claims")
        .select(`
          *,
          invoices!billing_claims_invoice_id_fkey(invoice_number, patient_id, total_amount, patients!invoices_patient_id_fkey(first_name, last_name))
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BillingClaim[];
    },
  });
}

export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (claim: Partial<BillingClaim>) => {
      const { data, error } = await supabase
        .from("billing_claims")
        .insert(claim as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing_claims"] });
      toast.success("Claim created");
    },
  });
}

export function useUpdateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BillingClaim> & { id: string }) => {
      const { data, error } = await supabase
        .from("billing_claims")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing_claims"] });
    },
  });
}

// ─── Payer Rate Mappings ───

export function usePayerRateMappings(payerName?: string) {
  return useQuery({
    queryKey: ["payer_rate_mappings", payerName],
    queryFn: async () => {
      let query = supabase
        .from("payer_rate_mappings")
        .select("*, billable_items!payer_rate_mappings_billable_item_id_fkey(name, code)")
        .order("payer_name");

      if (payerName) {
        query = query.eq("payer_name", payerName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PayerRateMapping[];
    },
  });
}

export function useCreatePayerRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rate: Partial<PayerRateMapping>) => {
      const { data, error } = await supabase
        .from("payer_rate_mappings")
        .insert(rate as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payer_rate_mappings"] });
      toast.success("Rate mapping created");
    },
  });
}

export function useUpdatePayerRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PayerRateMapping> & { id: string }) => {
      const { data, error } = await supabase
        .from("payer_rate_mappings")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payer_rate_mappings"] });
    },
  });
}

export function useDeletePayerRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payer_rate_mappings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payer_rate_mappings"] });
      toast.success("Rate mapping deleted");
    },
  });
}

// ─── Financial Summary ───

export function useFinancialSummary(period?: { from: string; to: string }) {
  return useQuery({
    queryKey: ["financial_summary", period],
    queryFn: async () => {
      let invoiceQuery = supabase.from("invoices").select("status, total_amount, amount_paid, amount_outstanding, created_at");
      let claimQuery = supabase.from("billing_claims").select("status, submitted_amount, paid_amount, created_at");

      if (period?.from) {
        invoiceQuery = invoiceQuery.gte("created_at", period.from);
        claimQuery = claimQuery.gte("created_at", period.from);
      }
      if (period?.to) {
        invoiceQuery = invoiceQuery.lte("created_at", period.to);
        claimQuery = claimQuery.lte("created_at", period.to);
      }

      const [{ data: invoices }, { data: claims }] = await Promise.all([
        invoiceQuery,
        claimQuery,
      ]);

      const totalInvoiced = (invoices || []).reduce((s: number, i: any) => s + Number(i.total_amount), 0);
      const totalCollected = (invoices || []).reduce((s: number, i: any) => s + Number(i.amount_paid), 0);
      const totalOutstanding = (invoices || []).reduce((s: number, i: any) => s + Number(i.amount_outstanding || 0), 0);
      const totalSubmitted = (claims || []).reduce((s: number, c: any) => s + Number(c.submitted_amount), 0);
      const totalClaimPaid = (claims || []).reduce((s: number, c: any) => s + Number(c.paid_amount), 0);
      const rejectedClaims = (claims || []).filter((c: any) => c.status === "rejected").length;
      const pendingClaims = (claims || []).filter((c: any) => c.status === "submitted").length;
      const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

      return {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        totalSubmitted,
        totalClaimPaid,
        rejectedClaims,
        pendingClaims,
        collectionRate,
        invoiceCount: invoices?.length || 0,
        claimCount: claims?.length || 0,
      };
    },
  });
}
