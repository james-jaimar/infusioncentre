import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AppointmentConfirm() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  const [info, setInfo] = useState<{
    already?: boolean;
    scheduled_start?: string;
    patient_name?: string;
    treatment_type?: string | null;
    error?: string;
  }>({});

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke(
        `confirm-appointment?token=${encodeURIComponent(token ?? "")}`,
      );
      if (error || data?.error) {
        setInfo({ error: data?.error ?? error?.message ?? "Could not confirm" });
        setState("err");
      } else {
        setInfo(data);
        setState("ok");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {state === "loading" && <><Loader2 className="h-5 w-5 animate-spin" /> Confirming…</>}
            {state === "ok" && <><CheckCircle2 className="h-5 w-5 text-green-600" /> Appointment confirmed</>}
            {state === "err" && <><XCircle className="h-5 w-5 text-destructive" /> Unable to confirm</>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {state === "ok" && (
            <>
              <p>Thank you{info.patient_name ? `, ${info.patient_name}` : ""}.</p>
              {info.scheduled_start && (
                <p>
                  Your {info.treatment_type ?? "appointment"} is scheduled for{" "}
                  <strong>
                    {new Date(info.scheduled_start).toLocaleString("en-ZA", {
                      timeZone: "Africa/Johannesburg",
                      weekday: "short", day: "numeric", month: "short",
                      hour: "2-digit", minute: "2-digit", hour12: false,
                    })}
                  </strong>.
                </p>
              )}
              {info.already && (
                <p className="text-muted-foreground">You'd already confirmed this appointment.</p>
              )}
              <p className="text-muted-foreground pt-2">
                We'll see you then. If anything changes, please contact the clinic.
              </p>
            </>
          )}
          {state === "err" && (
            <p className="text-muted-foreground">{info.error ?? "This link is invalid or expired."}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}