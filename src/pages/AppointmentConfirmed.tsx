import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  CalendarX2,
  CalendarSync,
  Mail,
  Phone,
  Stethoscope,
} from "lucide-react";

type Variant = {
  icon: typeof CheckCircle2;
  title: string;
  body: string;
  accent: string;
};

const VARIANTS: Record<string, Variant> = {
  confirmed: {
    icon: CheckCircle2,
    title: "You're confirmed",
    body: "Thanks for confirming your appointment. We look forward to seeing you.",
    accent: "text-green-600",
  },
  cancelled: {
    icon: CalendarX2,
    title: "Appointment cancelled",
    body: "Your appointment has been cancelled. Please contact us if you'd like to rebook.",
    accent: "text-destructive",
  },
  change_requested: {
    icon: CalendarSync,
    title: "Reschedule request sent",
    body: "We've received your request. Our team will be in touch shortly to arrange a new time.",
    accent: "text-primary",
  },
};

export default function AppointmentConfirmed() {
  const [params] = useSearchParams();
  const action = params.get("action") || "confirmed";
  const clinic = params.get("clinic") || "The Infusion Centre";
  const phone = params.get("phone") || "";
  const email = params.get("email") || "";

  const variant = useMemo(() => VARIANTS[action] ?? VARIANTS.confirmed, [action]);
  const Icon = variant.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-border/60 overflow-hidden">
        <div className="bg-primary text-primary-foreground px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Appointment</p>
              <h1 className="text-lg font-semibold leading-tight">{clinic}</h1>
            </div>
          </div>
        </div>

        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <Icon className={`h-14 w-14 mx-auto ${variant.accent}`} />
          <h2 className="text-2xl font-semibold">{variant.title}</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{variant.body}</p>

          {(phone || email) && (
            <div className="pt-4 mt-4 border-t text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Need help?</p>
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 hover:text-foreground">
                  <Phone className="h-3 w-3" /> {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center justify-center gap-2 hover:text-foreground">
                  <Mail className="h-3 w-3" /> {email}
                </a>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}