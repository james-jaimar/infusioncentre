import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Search, Eye, Globe, Armchair, Users } from "lucide-react";
import { toast } from "sonner";
import { useTenants, useCreateTenant, useUpdateTenant } from "@/hooks/useTenantAdmin";
import { usePlatformTenantStats } from "@/hooks/usePlatformAdmin";
import { useNavigate } from "react-router-dom";
import TenantForm from "@/components/platform/TenantForm";
import type { Tenant } from "@/contexts/TenantContext";

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "secondary" },
  starter: { label: "Starter", color: "outline" },
  professional: { label: "Professional", color: "default" },
  enterprise: { label: "Enterprise", color: "destructive" },
};

export default function PlatformTenants() {
  const { data: tenants = [], isLoading } = useTenants();
  const { data: stats = [] } = usePlatformTenantStats();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [search, setSearch] = useState("");

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const statsMap = Object.fromEntries(stats.map(s => [s.tenant_id, s]));

  const handleCreate = async (form: any) => {
    try {
      await createTenant.mutateAsync(form);
      toast.success("Tenant created successfully");
      setShowCreate(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create tenant");
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingTenant) return;
    try {
      await updateTenant.mutateAsync({ id: editingTenant.id, ...values });
      toast.success("Tenant updated");
      setEditingTenant(null);
    } catch {
      toast.error("Failed to update tenant");
    }
  };

  const handleImpersonate = (tenantId: string) => {
    sessionStorage.setItem("impersonated_tenant_id", tenantId);
    toast.success("Switched to tenant view");
    navigate("/admin");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">Manage clinics, subscriptions, and impersonation</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Tenant</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Tenant</DialogTitle></DialogHeader>
            <TenantForm onSubmit={handleCreate} submitLabel="Create Tenant" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map(t => {
            const planInfo = PLAN_LABELS[t.plan] || { label: t.plan, color: "secondary" };
            const s = statsMap[t.id];
            return (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
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
                      {s && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.patient_count} patients • {s.user_count}/{t.max_users} users • {s.appointment_count} appts/mo
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={planInfo.color as any}>{planInfo.label}</Badge>
                    <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditingTenant({ ...t })}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleImpersonate(t.id)} title="View as this tenant">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingTenant} onOpenChange={open => !open && setEditingTenant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Tenant</DialogTitle></DialogHeader>
          {editingTenant && (
            <TenantForm initialValues={editingTenant} onSubmit={handleUpdate} submitLabel="Save Changes" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
