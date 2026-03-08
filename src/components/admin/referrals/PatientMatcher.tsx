import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserPlus } from "lucide-react";

interface Props {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  currentPatientId?: string | null;
  onMatch: (patientId: string | null) => void;
}

export function PatientMatcher({ firstName, lastName, email, phone, currentPatientId, onMatch }: Props) {
  const [matches, setMatches] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!firstName || !lastName) {
      setMatches([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        // Search by name similarity, email, or phone
        const conditions: string[] = [];
        conditions.push(`and(first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%)`);
        if (email) conditions.push(`email.eq.${email}`);
        if (phone) conditions.push(`phone.eq.${phone}`);

        const { data } = await supabase
          .from("patients")
          .select("id, first_name, last_name, email, phone, date_of_birth, status")
          .or(conditions.join(","))
          .limit(5);

        setMatches(data || []);
      } catch {
        setMatches([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [firstName, lastName, email, phone]);

  if (matches.length === 0 && !searching) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground flex items-center gap-1">
        <UserCheck className="h-4 w-4" />
        {searching ? "Searching for existing patients..." : `${matches.length} potential match${matches.length !== 1 ? "es" : ""} found`}
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
      {matches.length > 0 && !currentPatientId && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <UserPlus className="h-3 w-3" /> Or leave unlinked to create a new patient record later.
        </p>
      )}
    </div>
  );
}
