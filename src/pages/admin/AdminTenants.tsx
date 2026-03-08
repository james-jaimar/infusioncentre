import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Users, Armchair, Palette, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTenants, useCreateTenant, useUpdateTenant } from "@/hooks/useTenantAdmin";
import { useTenant } from "@/contexts/TenantContext";
import type { Tenant } from "@/contexts/TenantContext";

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "secondary" },
  starter: { label: "Starter", color: "outline" },
  professional: { label: "Professional", color: "default" },
  enterprise: { label: "Enterprise", color: "destructive" },
};

export default function AdminTenants() {
  const { isSuperAdmin } = useTenant();
  const { data: tenants = [], isLoading } = useTenants();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    plan: "professional",
    billing_email: "",
    primary_color: "#3E5B84",
    secondary_color: "#6B8EB2",
    accent_color: "#E8A87C",
    max_chairs: 10,
    max_users: 50,
  });

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Tenant management is only available to super administrators.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    try {
      await createTenant.mutateAsync(form);
      toast.success("Tenant created successfully");
      setShowCreate(false);
      setForm({ name: "", slug: "", plan: "professional", billing_email: "", primary_color: "#3E5B84", secondary_color: "#6B8EB2", accent_color: "#E8A87C", max_chairs: 10, max_users: 50 });
    } catch (err: any) {
      toast.error(err.message || "Failed to create tenant");
    }
  };

  const handleUpdate = async () => {
    if (!editingTenant) return;
    try {
      await updateTenant.mutateAsync({
        id: editingTenant.id,
        name: editingTenant.name,
        primary_color: editingTenant.primary_color,
        secondary_color: editingTenant.secondary_color,
        accent_color: editingTenant.accent_color,
        max_chairs: editingTenant.max_chairs,
        max_users: editingTenant.max_users,
        is_active: editingTenant.is_active,
      });
      toast.success("Tenant updated");
      setEditingTenant(null);
    } catch {
      toast.error("Failed to update tenant");
    }
  };

  const TenantForm = ({ values, onChange, onSubmit, submitLabel }: {
    values: any;
    onChange: (updates: any) => void;
    onSubmit: () => void;
    submitLabel: string;
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Clinic Name</Label>
          <Input value={values.name} onChange={e => onChange({ ...values, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={values.slug} onChange={e => onChange({ ...values, slug: e.target.value })} placeholder="clinic-slug" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select value={values.plan} onValueChange={v => onChange({ ...values, plan: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Billing Email</Label>
          <Input type="email" value={values.billing_email || ""} onChange={e => onChange({ ...values, billing_email: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> Primary</Label>
          <div className="flex gap-2">
            <input type="color" value={values.primary_color} onChange={e => onChange({ ...values, primary_color: e.target.value })} className="h-10 w-12 rounded border cursor-pointer" />
            <Input value={values.primary_color} onChange={e => onChange({ ...values, primary_color: e.target.value })} className="flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Secondary</Label>
          <div className="flex gap-2">
            <input type="color" value={values.secondary_color} onChange={e => onChange({ ...values, secondary_color: e.target.value })} className="h-10 w-12 rounded border cursor-pointer" />
            <Input value={values.secondary_color} onChange={e => onChange({ ...values, secondary_color: e.target.value })} className="flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Accent</Label>
          <div className="flex gap-2">
            <input type="color" value={values.accent_color} onChange={e => onChange({ ...values, accent_color: e.target.value })} className="h-10 w-12 rounded border cursor-pointer" />
            <Input value={values.accent_color} onChange={e => onChange({ ...values, accent_color: e.target.value })} className="flex-1" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Armchair className="h-3 w-3" /> Max Chairs</Label>
          <Input type="number" value={values.max_chairs} onChange={e => onChange({ ...values, max_chairs: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Max Users</Label>
          <Input type="number" value={values.max_users} onChange={e => onChange({ ...values, max_users: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <Button onClick={onSubmit} className="w-full">{submitLabel}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">Manage clinics and their subscriptions</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Tenant</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Tenant</DialogTitle></DialogHeader>
            <TenantForm values={form} onChange={setForm} onSubmit={handleCreate} submitLabel="Create Tenant" />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {tenants.map(t => {
            const planInfo = PLAN_LABELS[t.plan] || { label: t.plan, color: "secondary" };
            return (
              <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setEditingTenant({ ...t })}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.primary_color }}>
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3 w-3" /> {t.slug}
                        {t.domain && <span>• {t.domain}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{t.max_chairs} chairs • {t.max_users} users</p>
                    </div>
                    <Badge variant={planInfo.color as any}>{planInfo.label}</Badge>
                    <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingTenant} onOpenChange={open => !open && setEditingTenant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Tenant</DialogTitle></DialogHeader>
          {editingTenant && (
            <TenantForm values={editingTenant} onChange={setEditingTenant} onSubmit={handleUpdate} submitLabel="Save Changes" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
