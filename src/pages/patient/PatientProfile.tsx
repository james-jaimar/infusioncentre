import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, MapPin, Shield, Heart } from "lucide-react";

export default function PatientProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patient, setPatient] = useState<any>(null);
  const [medHistory, setMedHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (p) {
        setPatient(p);
        setPhone(p.phone || "");
        setAddressLine1(p.address_line_1 || "");
        setAddressLine2(p.address_line_2 || "");
        setCity(p.city || "");
        setPostalCode(p.postal_code || "");
        setEmergencyName(p.emergency_contact_name || "");
        setEmergencyPhone(p.emergency_contact_phone || "");
        setEmergencyRelationship(p.emergency_contact_relationship || "");

        const { data: mh } = await supabase
          .from("patient_medical_history")
          .select("*")
          .eq("patient_id", p.id)
          .single();
        setMedHistory(mh);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);
    const { error } = await supabase
      .from("patients")
      .update({
        phone,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city,
        postal_code: postalCode,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        emergency_contact_relationship: emergencyRelationship,
      })
      .eq("id", patient.id);
    setSaving(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
  };

  if (loading) return <div className="p-4 text-muted-foreground">Loading profile...</div>;
  if (!patient) return <div className="p-4 text-muted-foreground">No patient record found.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">View and update your details</p>
      </div>

      {/* Basic info - read only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Name</p>
              <p className="font-medium">{patient.first_name} {patient.last_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p>{patient.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Date of Birth</p>
              <p>{patient.date_of_birth || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">ID Number</p>
              <p>{patient.id_number || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact - editable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Address Line 1</Label>
              <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
            </div>
            <div>
              <Label>Address Line 2</Label>
              <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </div>
            <div>
              <Label>Relationship</Label>
              <Input value={emergencyRelationship} onChange={(e) => setEmergencyRelationship(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Changes"}
      </Button>

      {/* Medical history - read only */}
      {medHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4" /> Medical History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {medHistory.allergies?.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Allergies</p>
                <div className="flex flex-wrap gap-1">
                  {medHistory.allergies.map((a: string) => (
                    <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}
            {medHistory.chronic_conditions?.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Chronic Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {medHistory.chronic_conditions.map((c: string) => (
                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
            {medHistory.notes && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Notes</p>
                <p>{medHistory.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
