import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useInvoices,
  useBillingClaims,
  usePayerRateMappings,
  useFinancialSummary,
  useUpdateInvoice,
  useCreateClaim,
  useUpdateClaim,
  useCreatePayerRate,
  useDeletePayerRate,
  type Invoice,
  type BillingClaim,
  type PayerRateMapping,
} from "@/hooks/useBilling";
import { useBillableItems } from "@/hooks/useBillableItems";
import { format } from "date-fns";
import {
  DollarSign, FileText, AlertTriangle, CheckCircle, TrendingUp,
  Send, Eye, Plus, Trash2, Download, PieChart,
} from "lucide-react";
import { toast } from "sonner";

const invoiceStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  finalized: "bg-blue-100 text-blue-800",
  submitted: "bg-yellow-100 text-yellow-800",
  partially_paid: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  void: "bg-destructive/10 text-destructive",
};

const claimStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-destructive/10 text-destructive",
  appealed: "bg-orange-100 text-orange-800",
  partially_paid: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  written_off: "bg-muted text-muted-foreground",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);

export default function AdminBilling() {
  const [invoiceStatus, setInvoiceStatus] = useState("all");
  const [claimStatus, setClaimStatus] = useState("all");
  const { data: invoices, isLoading: loadingInvoices } = useInvoices({ status: invoiceStatus });
  const { data: claims, isLoading: loadingClaims } = useBillingClaims({ status: claimStatus });
  const { data: summary } = useFinancialSummary();
  const { data: rates } = usePayerRateMappings();
  const { data: billableItems } = useBillableItems();
  const updateInvoice = useUpdateInvoice();
  const updateClaim = useUpdateClaim();
  const createClaim = useCreateClaim();
  const createRate = useCreatePayerRate();
  const deleteRate = useDeletePayerRate();

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [showNewRate, setShowNewRate] = useState(false);
  const [rateForm, setRateForm] = useState({ payer_name: "", billable_item_id: "", contracted_rate: "" });

  // CSV export
  const exportInvoicesCSV = () => {
    if (!invoices?.length) return;
    const headers = ["Invoice #", "Patient", "Status", "Total", "Paid", "Outstanding", "Date"];
    const rows = invoices.map((i) => [
      i.invoice_number,
      `${(i.patients as any)?.first_name} ${(i.patients as any)?.last_name}`,
      i.status,
      i.total_amount,
      i.amount_paid,
      i.amount_outstanding,
      format(new Date(i.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoices exported");
  };

  const handleSubmitClaim = async (invoice: Invoice) => {
    try {
      await createClaim.mutateAsync({
        invoice_id: invoice.id,
        payer_name: invoice.medical_aid_name || invoice.payer_name || "Unknown",
        submitted_amount: invoice.total_amount,
        status: "submitted" as any,
        submitted_at: new Date().toISOString(),
      });
      await updateInvoice.mutateAsync({ id: invoice.id, status: "submitted" as any });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Billing & Revenue</h1>
        <Button variant="outline" onClick={exportInvoicesCSV} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.totalInvoiced || 0)}</p>
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shrink-0">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.totalCollected || 0)}</p>
              <p className="text-sm text-muted-foreground">Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 shrink-0">
              <TrendingUp className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.totalOutstanding || 0)}</p>
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary?.rejectedClaims || 0}</p>
              <p className="text-sm text-muted-foreground">Rejected Claims</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection rate bar */}
      {summary && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Collection Rate</span>
              <span className="text-sm font-bold text-foreground">{summary.collectionRate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${summary.collectionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="rates">Payer Rates</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex gap-3">
            <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingInvoices ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : !invoices?.length ? (
                <div className="p-8 text-center text-muted-foreground">
                  No invoices yet. Invoices are generated from treatment course billing items.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Payer</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                        <TableCell className="font-medium">
                          {(inv.patients as any)?.first_name} {(inv.patients as any)?.last_name}
                        </TableCell>
                        <TableCell>{inv.payer_name || inv.medical_aid_name || "Patient"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.amount_outstanding)}</TableCell>
                        <TableCell>
                          <Badge className={invoiceStatusColors[inv.status] || ""}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(inv.issued_date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewInvoice(inv)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(inv.status === "draft" || inv.status === "finalized") && inv.medical_aid_name && (
                            <Button size="sm" variant="default" onClick={() => handleSubmitClaim(inv)}>
                              <Send className="h-4 w-4 mr-1" /> Submit Claim
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-4">
          <div className="flex gap-3">
            <Select value={claimStatus} onValueChange={setClaimStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="appealed">Appealed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="written_off">Written Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingClaims ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : !claims?.length ? (
                <div className="p-8 text-center text-muted-foreground">No claims found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Payer</TableHead>
                      <TableHead className="text-right">Submitted</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm">{c.claim_reference || "—"}</TableCell>
                        <TableCell>{(c.invoices as any)?.invoice_number}</TableCell>
                        <TableCell className="font-medium">
                          {(c.invoices as any)?.patients?.first_name} {(c.invoices as any)?.patients?.last_name}
                        </TableCell>
                        <TableCell>{c.payer_name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.submitted_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.paid_amount)}</TableCell>
                        <TableCell>
                          <Badge className={claimStatusColors[c.status] || ""}>{c.status}</Badge>
                          {c.rejection_reason && (
                            <p className="text-xs text-destructive mt-1">{c.rejection_reason}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.submitted_at ? format(new Date(c.submitted_at), "dd MMM yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payer Rates Tab */}
        <TabsContent value="rates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewRate(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Rate Mapping
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {!rates?.length ? (
                <div className="p-8 text-center text-muted-foreground">
                  No payer rate mappings yet. Add contracted rates for medical aids.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payer</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Contracted Rate</TableHead>
                      <TableHead>Claimable</TableHead>
                      <TableHead>Effective</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.payer_name}</TableCell>
                        <TableCell>{(r.billable_items as any)?.name}</TableCell>
                        <TableCell className="font-mono text-sm">{(r.billable_items as any)?.code || "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.contracted_rate)}</TableCell>
                        <TableCell>
                          <Badge variant={r.is_claimable ? "default" : "secondary"}>
                            {r.is_claimable ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(r.effective_from), "dd MMM yyyy")}
                          {r.effective_to && ` — ${format(new Date(r.effective_to), "dd MMM yyyy")}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRate.mutate(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* New Rate Dialog */}
          <Dialog open={showNewRate} onOpenChange={setShowNewRate}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Payer Rate Mapping</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payer / Medical Aid Name</Label>
                  <Input value={rateForm.payer_name} onChange={(e) => setRateForm({ ...rateForm, payer_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Billable Item</Label>
                  <Select value={rateForm.billable_item_id} onValueChange={(v) => setRateForm({ ...rateForm, billable_item_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {billableItems?.map((bi: any) => (
                        <SelectItem key={bi.id} value={bi.id}>{bi.name} {bi.code ? `(${bi.code})` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contracted Rate (ZAR)</Label>
                  <Input
                    type="number"
                    value={rateForm.contracted_rate}
                    onChange={(e) => setRateForm({ ...rateForm, contracted_rate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewRate(false)}>Cancel</Button>
                <Button
                  disabled={!rateForm.payer_name || !rateForm.billable_item_id || !rateForm.contracted_rate}
                  onClick={async () => {
                    await createRate.mutateAsync({
                      payer_name: rateForm.payer_name,
                      billable_item_id: rateForm.billable_item_id,
                      contracted_rate: Number(rateForm.contracted_rate),
                    });
                    setShowNewRate(false);
                    setRateForm({ payer_name: "", billable_item_id: "", contracted_rate: "" });
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Invoice Preview Dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {previewInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Patient</span>
                  <span className="font-medium">
                    {(previewInvoice.patients as any)?.first_name} {(previewInvoice.patients as any)?.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Payer</span>
                  <span className="font-medium">{previewInvoice.payer_name || "Patient"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Medical Aid</span>
                  <span className="font-medium">{previewInvoice.medical_aid_name || "—"} {previewInvoice.medical_aid_number || ""}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <Badge className={invoiceStatusColors[previewInvoice.status] || ""}>{previewInvoice.status}</Badge>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(previewInvoice.subtotal)}</span>
                </div>
                {previewInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCurrency(previewInvoice.discount_amount)}</span>
                  </div>
                )}
                {previewInvoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(previewInvoice.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(previewInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{formatCurrency(previewInvoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-primary">
                  <span>Outstanding</span>
                  <span>{formatCurrency(previewInvoice.amount_outstanding)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
