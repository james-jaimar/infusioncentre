import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Globe, Bell } from "lucide-react";
import { toast } from "sonner";

export default function PlatformSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Global configuration for the entire platform</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Globe className="h-5 w-5" /> Platform Identity</CardTitle>
            <CardDescription>Global branding and platform name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input defaultValue="Infusion Centre" />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input type="email" defaultValue="support@infusioncentre.co.za" />
              </div>
            </div>
            <Button onClick={() => toast.success("Settings saved")} variant="outline">Save Identity</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5" /> Default Plan Limits</CardTitle>
            <CardDescription>Default resource caps for each subscription tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { plan: "Free", chairs: 2, users: 5 },
              { plan: "Starter", chairs: 5, users: 20 },
              { plan: "Professional", chairs: 15, users: 50 },
              { plan: "Enterprise", chairs: 100, users: 500 },
            ].map(p => (
              <div key={p.plan} className="flex items-center gap-4 py-2">
                <span className="w-32 font-medium">{p.plan}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Chairs</Label>
                  <Input type="number" defaultValue={p.chairs} className="w-20 h-8" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Users</Label>
                  <Input type="number" defaultValue={p.users} className="w-20 h-8" />
                </div>
              </div>
            ))}
            <Button onClick={() => toast.success("Plan limits saved")} variant="outline">Save Limits</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Platform-wide notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Usage Alerts</p>
                <p className="text-xs text-muted-foreground">Email when a tenant exceeds 90% of their plan limits</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">New Tenant Notifications</p>
                <p className="text-xs text-muted-foreground">Email when a new tenant signs up</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Failed Payment Alerts</p>
                <p className="text-xs text-muted-foreground">Alert when subscription payments fail</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
