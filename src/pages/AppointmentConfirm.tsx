import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarX2,
  CalendarSync,
  Mail,
  Phone,
  Stethoscope,
} from "lucide-react";

type Brand = { name: string; phone?: string; email?: string };
type ApptInfo = {
  scheduled_start?: string;
  patient_name?: string;
  treatment_type?: string | null;
  status?: string;
  already?: boolean;
  action?: string | null;
  brand?: Brand;
};

const PREVIEW_INFO: ApptInfo = {
  scheduled_start: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  patient_name: "Jane Doe",
  treatment_type: "Iron Infusion",
  status: "scheduled",
  brand: {
    name: "The Johannesburg Infusion Centre",
    phone: "+27 11 000 0000",
    email: "hello@infusioncentre.co.za",
  },
};

export default function AppointmentConfirm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isPreview = token === "preview";

  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<ApptInfo>(isPreview ? PREVIEW_INFO : {});
  const [busy, setBusy] = useState<"" | "confirm" | "cancel" | "change">("");
  const [changeMsg, setChangeMsg] = useState("");
  const [showChange, setShowChange] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const runAction = async (action: "info" | "confirm" | "cancel" | "request_change", message?: string) => {
    if (isPreview) return { ok: true } as const;
    const { data, error: err } = await supabase.functions.invoke("confirm-appointment", {
      body: { token: token ?? "", action, message },
    });
    if (err || data?.error) {
      return { ok: false as const, error: data?.error ?? err?.message ?? "Something went wrong" };
    }
    setInfo((prev) => ({ ...prev, ...data }));
    return { ok: true as const };
  };

  useEffect(() => {
    if (isPreview) return;
    (async () => {
      const res = await runAction("info");
      if (!res.ok) setError(res.error);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const brand = info.brand ?? PREVIEW_INFO.brand!;
  const goToConfirmation = (action: "confirmed" | "cancelled" | "change_requested") => {
    const params = new URLSearchParams({ action });
    if (brand.name) params.set("clinic", brand.name);
    if (brand.phone) params.set("phone", brand.phone);
    if (brand.email) params.set("email", brand.email);
    navigate(`/appointment/confirmed?${params.toString()}`);
  };

  const scheduledLabel = useMemo(() => {
    if (!info.scheduled_start) return "";
    return new Date(info.scheduled_start).toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [info.scheduled_start]);

  const status = info.status ?? "scheduled";
  const confirmed = status === "confirmed" || info.action === "confirmed" || info.already;
  const cancelled = status === "cancelled" || info.action === "cancelled";
  const changeRequested = info.action === "change_requested";
  const locked = cancelled;

  const handleConfirm = async () => {
    setBusy("confirm");
    const res = await runAction("confirm");
    setBusy("");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    goToConfirmation("confirmed");
  };
  const handleCancel = async () => {
    setBusy("cancel");
    const res = await runAction("cancel", cancelMsg);
    setBusy("");
    setShowCancel(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    goToConfirmation("cancelled");
  };
  const handleChange = async () => {
    setBusy("change");
    const res = await runAction("request_change", changeMsg);
    setBusy("");
    setShowChange(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    goToConfirmation("change_requested");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-border/60 overflow-hidden">
        {/* Branded header */}
        <div className="bg-primary text-primary-foreground px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Appointment</p>
              <h1 className="text-lg font-semibold leading-tight">{brand.name}</h1>
            </div>
          </div>
        </div>

        <CardHeader className="pb-2">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your appointment…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="h-4 w-4" /> {error}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Hi {info.patient_name?.split(" ")[0] || "there"},
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                {cancelled
                  ? "Your appointment has been cancelled"
                  : confirmed
                    ? "You're confirmed — see you soon"
                    : "Please review your appointment"}
              </h2>
            </div>
          )}
        </CardHeader>

        {!loading && !error && (
          <CardContent className="space-y-5">
            {/* Appointment summary */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{scheduledLabel}</span>
              </div>
              {info.treatment_type && (
                <p className="text-sm text-muted-foreground pl-6">{info.treatment_type}</p>
              )}
              {isPreview && (
                <p className="text-[11px] uppercase tracking-wider text-primary/70 font-semibold pt-1">
                  Preview mode
                </p>
              )}
            </div>

            {/* Status banners */}
            {confirmed && !cancelled && (
              <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 text-green-800 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <span>Thanks for confirming. We look forward to seeing you.</span>
              </div>
            )}
            {cancelled && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 text-destructive p-3 text-sm">
                <CalendarX2 className="h-4 w-4 mt-0.5" />
                <span>This appointment has been cancelled. Please contact us to rebook.</span>
              </div>
            )}
            {changeRequested && (
              <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 text-primary p-3 text-sm">
                <CalendarSync className="h-4 w-4 mt-0.5" />
                <span>Your request has been received. Our team will be in touch shortly to reschedule.</span>
              </div>
            )}

            {/* Action buttons */}
            {!locked && !showCancel && !showChange && (
              <div className="grid gap-2">
                {!confirmed && (
                  <Button
                    size="lg"
                    className="w-full h-12 text-base"
                    onClick={handleConfirm}
                    disabled={busy === "confirm"}
                  >
                    {busy === "confirm" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Confirm attendance
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12"
                    onClick={() => setShowChange(true)}
                  >
                    <CalendarSync className="h-4 w-4 mr-2" /> Request new date
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 text-destructive hover:text-destructive hover:bg-destructive/5"
                    onClick={() => setShowCancel(true)}
                  >
                    <CalendarX2 className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel form */}
            {showCancel && !cancelled && (
              <div className="space-y-3 rounded-md border border-destructive/30 p-3 bg-destructive/5">
                <Label className="text-sm">Reason for cancelling (optional)</Label>
                <Textarea
                  rows={3}
                  value={cancelMsg}
                  onChange={(e) => setCancelMsg(e.target.value)}
                  placeholder="Feeling unwell, scheduling conflict, etc."
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowCancel(false)}>Back</Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={busy === "cancel"}
                  >
                    {busy === "cancel" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm cancellation
                  </Button>
                </div>
              </div>
            )}

            {/* Change request form */}
            {showChange && !changeRequested && (
              <div className="space-y-3 rounded-md border border-primary/30 p-3 bg-primary/5">
                <Label className="text-sm">Tell us what dates/times work for you</Label>
                <Textarea
                  rows={3}
                  value={changeMsg}
                  onChange={(e) => setChangeMsg(e.target.value)}
                  placeholder="e.g. Any weekday morning next week"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowChange(false)}>Back</Button>
                  <Button onClick={handleChange} disabled={busy === "change"}>
                    {busy === "change" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Send request
                  </Button>
                </div>
              </div>
            )}

            {/* Clinic contact footer */}
            {(brand.phone || brand.email) && (
              <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Need help?</p>
                {brand.phone && (
                  <a href={`tel:${brand.phone}`} className="flex items-center gap-2 hover:text-foreground">
                    <Phone className="h-3 w-3" /> {brand.phone}
                  </a>
                )}
                {brand.email && (
                  <a href={`mailto:${brand.email}`} className="flex items-center gap-2 hover:text-foreground">
                    <Mail className="h-3 w-3" /> {brand.email}
                  </a>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}