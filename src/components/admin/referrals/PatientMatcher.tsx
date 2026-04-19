import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserPlus, CheckCircle2, X } from "lucide-react";

interface Props {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  currentPatientId?: string | null;
  onMatch: (patientId: string | null) => void;
  onCreatePatient?: () => void;
}

export function PatientMatcher({ firstName, lastName, email, phone, currentPatientId, onMatch, onCreatePatient }: Props) {
  const [matches, setMatches] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkedPatient, setLinkedPatient] = useState<any | null>(null);
  const autoLinkedRef = useRef(false);

  // Fetch the linked patient details for the banner
  useEffect(() => {
    if (!currentPatientId) {
      setLinkedPatient(null);
      return;
    }
    const found = matches.find((m) => m.id === currentPatientId);
    if (found) {
      setLinkedPatient(found);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, phone, date_of_birth, status")
        .eq("id", currentPatientId)
        .maybeSingle();
      if (data) setLinkedPatient(data);
    })();
  }, [currentPatientId, matches]);

  useEffect(() => {
    if (!firstName || !lastName) {
      setMatches([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const conditions: string[] = [];
        conditions.push(`and(first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%)`);
        if (email) conditions.push(`email.eq.${email}`);
        if (phone) conditions.push(`phone.eq.${phone}`);

        const { data } = await supabase
          .from("patients")
          .select("id, first_name, last_name, email, phone, date_of_birth, status")
          .or(conditions.join(","))
          .limit(5);

        const list = data || [];
        setMatches(list);

        // Auto-link on exact email/phone match (only once per referral, only if nothing linked yet)
        if (!currentPatientId && !autoLinkedRef.current) {
          const exact = list.find(
            (p: any) =>
              (email && p.email && p.email.toLowerCase() === email.toLowerCase()) ||
              (phone && p.phone && p.phone === phone)
          );
          if (exact) {
            autoLinkedRef.current = true;
            onMatch(exact.id);
          }
        }
      } catch {
        setMatches([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, email, phone]);

  return (
    <div className="space-y-3">
      {linkedPatient && (
        <div className="rounded-lg border border-primary bg-primary/5 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium">
                Linked to: {linkedPatient.first_name} {linkedPatient.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {[linkedPatient.email, linkedPatient.phone].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onMatch(null)} className="gap-1">
            <X className="h-4 w-4" /> Unlink
          </Button>
        </div>
      )}

      <p className="text-sm font-medium text-foreground flex items-center gap-1">
        <UserCheck className="h-4 w-4" />
        {searching
          ? "Searching for existing patients..."
          : matches.length > 0
            ? `${matches.length} potential match${matches.length !== 1 ? "es" : ""} found`
            : "No existing patients matched"}
      </p>

      {matches.map((p) => (
        <Card
          key={p.id}
          className={`cursor-pointer transition-colors ${currentPatientId === p.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}
          onClick={() => onMatch(currentPatientId === p.id ? null : p.id)}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">
                {p.first_name} {p.last_name}
                <Badge variant="outline" className="ml-2 text-xs">{p.status}</Badge>
              </p>
              <p className="text-muted-foreground text-xs">
                {[p.email, p.phone, p.date_of_birth].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Button
              variant={currentPatientId === p.id ? "default" : "outline"}
              size="sm"
            >
              {currentPatientId === p.id ? "Linked" : "Link"}
            </Button>
          </CardContent>
        </Card>
      ))}
      {!currentPatientId && onCreatePatient && (
        <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors" onClick={onCreatePatient}>
          <CardContent className="p-3 flex items-center gap-2 text-sm">
            <UserPlus className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Create New Patient</p>
              <p className="text-muted-foreground text-xs">
                Create a patient record from referral data ({firstName} {lastName})
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
