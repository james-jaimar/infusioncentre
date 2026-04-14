import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";
import { useFeatureFlags, useToggleFeatureFlag } from "@/hooks/useClinicSettings";

const GROUP_CONFIG = [
  {
    title: "Admin Notifications",
    icon: Building2,
    prefix: "notify_admin_",
  },
  {
    title: "Doctor Notifications",
    icon: Stethoscope,
    prefix: "notify_doctor_",
  },
  {
    title: "Patient Notifications",
    icon: User,
    prefix: "notify_patient_",
  },
];

export default function EmailNotificationsTab() {
  const { data: flags = [], isLoading } = useFeatureFlags();
  const toggle = useToggleFeatureFlag();

  const notificationFlags = flags.filter((f) => f.category === "notifications");

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggle.mutateAsync({ id, is_enabled: !current });
      toast.success("Notification setting updated");
    } catch {
      toast.error("Failed to update notification setting");
    }
  };

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>Control which automated email notifications are sent. Disabled notifications will be silently skipped.</span>
      </div>

      {GROUP_CONFIG.map(({ title, icon: Icon, prefix }) => {
        const groupFlags = notificationFlags
          .filter((f) => f.key.startsWith(prefix))
          .sort((a, b) => a.display_order - b.display_order);

        if (groupFlags.length === 0) return null;

        return (
          <Card key={prefix}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupFlags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{flag.label}</span>
                      <Badge variant={flag.is_enabled ? "default" : "secondary"} className="text-xs">
                        {flag.is_enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                    {flag.description && (
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={() => handleToggle(flag.id, flag.is_enabled)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
