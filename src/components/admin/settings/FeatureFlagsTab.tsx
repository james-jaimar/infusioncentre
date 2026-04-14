import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { useFeatureFlags, useToggleFeatureFlag } from "@/hooks/useClinicSettings";

const CATEGORY_LABELS: Record<string, string> = {
  clinical: "Clinical",
  communications: "Communications",
  patient: "Patient",
  doctor: "Doctor",
  billing: "Billing",
  general: "General",
};

export default function FeatureFlagsTab() {
  const { data: flags = [], isLoading } = useFeatureFlags();
  const toggle = useToggleFeatureFlag();

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggle.mutateAsync({ id, is_enabled: !current });
      toast.success("Feature flag updated");
    } catch {
      toast.error("Failed to update feature flag");
    }
  };

  const nonNotificationFlags = flags.filter((f) => f.category !== "notifications");
  const grouped = nonNotificationFlags.reduce<Record<string, typeof flags>>((acc, flag) => {
    const cat = flag.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flag);
    return acc;
  }, {});

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading...</p>;

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, categoryFlags]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {CATEGORY_LABELS[category] || category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryFlags.map(flag => (
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
      ))}
    </div>
  );
}
