import { useState, useEffect } from "react";
import { useDoctorProfile } from "@/hooks/useDoctors";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { User, Building2, Bell } from "lucide-react";

export default function DoctorProfile() {
  const { data: doctor, isLoading } = useDoctorProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    practice_name: "",
    practice_number: "",
    specialisation: "",
    phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    postal_code: "",
  });

  const [prefs, setPrefs] = useState({
    email_frequency: "immediate",
    report_delivery: true,
  });

  useEffect(() => {
    if (doctor) {
      setForm({
        practice_name: doctor.practice_name || "",
        practice_number: doctor.practice_number || "",
        specialisation: doctor.specialisation || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        address_line_1: doctor.address_line_1 || "",
        address_line_2: doctor.address_line_2 || "",
        city: doctor.city || "",
        postal_code: doctor.postal_code || "",
      });
      const np = (doctor as any).notification_preferences;
      if (np) {
        setPrefs({
          email_frequency: np.email_frequency || "immediate",
          report_delivery: np.report_delivery !== false,
        });
      }
    }
  }, [doctor]);

  const handleSave = async () => {
    if (!doctor?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("doctors").update({
        ...form,
        notification_preferences: prefs,
      }).eq("id", doctor.id);

      if (error) throw error;
      toast({ title: "Profile updated" });
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" /> Practice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Practice Name</Label>
              <Input value={form.practice_name} onChange={(e) => setForm({ ...form, practice_name: e.target.value })} />
            </div>
            <div>
              <Label>HPCSA Practice Number</Label>
              <Input value={form.practice_number} onChange={(e) => setForm({ ...form, practice_number: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Specialisation</Label>
            <Input value={form.specialisation} onChange={(e) => setForm({ ...form, specialisation: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" /> Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Address Line 1</Label>
            <Input value={form.address_line_1} onChange={(e) => setForm({ ...form, address_line_1: e.target.value })} />
          </div>
          <div>
            <Label>Address Line 2</Label>
            <Input value={form.address_line_2} onChange={(e) => setForm({ ...form, address_line_2: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email Notification Frequency</Label>
            <Select value={prefs.email_frequency} onValueChange={(v) => setPrefs({ ...prefs, email_frequency: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={prefs.report_delivery}
              onCheckedChange={(v) => setPrefs({ ...prefs, report_delivery: v })}
            />
            <Label>Receive clinical reports via email</Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
