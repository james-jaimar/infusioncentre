import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Save, Clock, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useClinicSettings, useUpdateClinicSetting, type ClinicSetting } from "@/hooks/useClinicSettings";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  general: <Building2 className="h-4 w-4" />,
  security: <Clock className="h-4 w-4" />,
  scheduling: <Clock className="h-4 w-4" />,
  billing: <Receipt className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General Information",
  security: "Security",
  scheduling: "Scheduling",
  billing: "Billing",
};

export default function ClinicSettingsTab() {
  const { data: settings = [], isLoading } = useClinicSettings();
  const updateSetting = useUpdateClinicSetting();
  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // Initialize edited values from DB
    const vals: Record<string, unknown> = {};
    settings.forEach(s => { vals[s.key] = s.value; });
    setEditedValues(vals);
  }, [settings]);

  const handleSave = async () => {
    try {
      for (const setting of settings) {
        if (JSON.stringify(editedValues[setting.key]) !== JSON.stringify(setting.value)) {
          await updateSetting.mutateAsync({ key: setting.key, value: editedValues[setting.key] });
        }
      }
      toast.success("Clinic settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const hasChanges = settings.some(s => JSON.stringify(editedValues[s.key]) !== JSON.stringify(s.value));

  const grouped = settings.reduce<Record<string, ClinicSetting[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const renderField = (setting: ClinicSetting) => {
    const value = editedValues[setting.key];
    const key = setting.key;

    // Address field (object)
    if (key === "business_address" && typeof value === "object" && value !== null) {
      const addr = value as Record<string, string>;
      return (
        <div className="grid grid-cols-2 gap-2">
          {["line1", "line2", "city", "postal_code"].map(field => (
            <div key={field} className="space-y-1">
              <Label className="text-xs capitalize">{field.replace("_", " ")}</Label>
              <Input value={addr[field] || ""} onChange={e =>
                setEditedValues(prev => ({
                  ...prev,
                  [key]: { ...(prev[key] as Record<string, string>), [field]: e.target.value },
                }))
              } />
            </div>
          ))}
        </div>
      );
    }

    // Business hours (object)
    if (key === "business_hours" && typeof value === "object" && value !== null) {
      const hours = value as Record<string, string>;
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {days.map(day => (
            <div key={day} className="space-y-1">
              <Label className="text-xs capitalize">{day}</Label>
              <Input value={hours[day] || "closed"} onChange={e =>
                setEditedValues(prev => ({
                  ...prev,
                  [key]: { ...(prev[key] as Record<string, string>), [day]: e.target.value },
                }))
              } placeholder="08:00-17:00 or closed" />
            </div>
          ))}
        </div>
      );
    }

    // Numeric
    if (typeof value === "number") {
      return (
        <Input type="number" value={value} onChange={e =>
          setEditedValues(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))
        } />
      );
    }

    // String
    return (
      <Input value={typeof value === "string" ? value : String(value ?? "")} onChange={e =>
        setEditedValues(prev => ({ ...prev, [key]: e.target.value }))
      } />
    );
  };

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading...</p>;

  return (
    <div className="space-y-4">
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save All Changes
          </Button>
        </div>
      )}

      {Object.entries(grouped).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {CATEGORY_ICONS[category] || <Building2 className="h-4 w-4" />}
              {CATEGORY_LABELS[category] || category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySettings.map(setting => (
              <div key={setting.key} className="space-y-2">
                <Label>{setting.label}</Label>
                {setting.description && (
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                )}
                {renderField(setting)}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
