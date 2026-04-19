import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUpdateReferralStatus,
  useCreatePatientFromReferral,
  useLinkReferralPatient,
  useReferral,
} from "@/hooks/useReferrals";
import { useAllowedTransitions, useStatusDisplay } from "@/hooks/useStatusDictionaries";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PatientMatcher } from "./PatientMatcher";
import { ReferralStatusTimeline } from "./ReferralStatusTimeline";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CheckCircle, XCircle, MessageSquare, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  referral: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToCourse: (referral: any, patientId: string) => void;
}

// Fire-and-forget doctor notification — don't block UI on cold-starts
function notifyDoctorAsync(referral: any, toStatus: string, statusLabel: string, notes: string) {
  const doctorEmail = (referral.doctors as any)?.email;
  if (!doctorEmail) return;
  void supabase.functions
    .invoke("send-email", {
      body: {
        to: doctorEmail,
        subject: `Referral Update: ${referral.patient_first_name} ${referral.patient_last_name} — ${statusLabel}`,
        html: `<p>Dear ${(referral.doctors as any)?.practice_name || "Doctor"},</p>
          <p>Your referral for <strong>${referral.patient_first_name} ${referral.patient_last_name}</strong> has been updated to: <strong>${statusLabel}</strong>.</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
          <p>Thank you,<br/>Gail Infusion Centre</p>`,
        related_entity_type: "referral",
        related_entity_id: referral.id,
        notification_key: "notify_admin_doctor_referral",
      },
    })
    .catch((err) => console.error("Doctor notification failed (non-blocking):", err));
}

export function ReferralTriageDialog({ referral: referralProp, open, onOpenChange, onConvertToCourse }: Props) {
  const updateStatus = useUpdateReferralStatus();
  const createPatient = useCreatePatientFromReferral();
  const linkPatient = useLinkReferralPatient();
  const { user } = useAuth();

  // Always read fresh data — props are stale after status transitions
  const { data: fresh } = useReferral(referralProp?.id);
  const referral = fresh
    ? { ...referralProp, ...fresh, doctors: referralProp?.doctors || (fresh as any).doctors, doctor_display_name: referralProp?.doctor_display_name }
    : referralProp;

  const allowedTransitions = useAllowedTransitions("referral", referral?.status || "pending");
  const getStatus = useStatusDisplay("referral");

  const [activeTab, setActiveTab] = useState("details");
  const [reviewNotes, setReviewNotes] = useState(referral?.notes || "");
  const [infoRequestMessage, setInfoRequestMessage] = useState("");
  const [pendingTo, setPendingTo] = useState<string | null>(null);

  // Reset notes when switching referrals
  useEffect(() => {
    setReviewNotes(referralProp?.notes || "");
    setInfoRequestMessage("");
    setActiveTab("details");
  }, [referralProp?.id]);

  if (!referral) return null;

  const linkedPatientId: string | null = referral.patient_id || null;
  const status = getStatus(referral.status);

  const handleLinkPatient = async (patientId: string | null) => {
    try {
      await linkPatient.mutateAsync({ referralId: referral.id, patientId });
      toast.success(patientId ? "Patient linked" : "Patient unlinked");
    } catch (e: any) {
      toast.error(e.message || "Failed to update link");
    }
  };

  const handleTransition = async (toStatus: string, opts?: { skipNotify?: boolean }) => {
    // Guard: Accept requires linked patient
    if (toStatus === "accepted" && !linkedPatientId) {
      toast.error("Link a patient before accepting this referral");
      setActiveTab("patient");
      return;
    }

    setPendingTo(toStatus);
    try {
      await updateStatus.mutateAsync({
        id: referral.id,
        status: toStatus,
        reviewed_by: user?.id,
        notes: reviewNotes,
        from_status: referral.status,
      });

      const statusLabel = getStatus(toStatus).label;
      if (!opts?.skipNotify) {
        notifyDoctorAsync(referral, toStatus, statusLabel, reviewNotes);
      }

      toast.success(`Referral status: ${statusLabel}`);
      // Don't auto-close — let user see new status & take next action
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    } finally {
      setPendingTo(null);
    }
  };

  const handleRequestInfo = async () => {
    const doctorEmail = (referral.doctors as any)?.email;
    if (!doctorEmail) {
      toast.error("Doctor email not on file");
      return;
    }
    if (!infoRequestMessage.trim()) {
      toast.error("Describe what information is needed");
      return;
    }

    // Fire-and-forget the bespoke info-request email
    void supabase.functions
      .invoke("send-email", {
        body: {
          to: doctorEmail,
          subject: `Information Required: Referral for ${referral.patient_first_name} ${referral.patient_last_name}`,
          html: `<p>Dear ${(referral.doctors as any)?.practice_name || "Doctor"},</p>
            <p>We require additional information regarding your referral for <strong>${referral.patient_first_name} ${referral.patient_last_name}</strong>:</p>
            <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin: 12px 0;">${infoRequestMessage}</blockquote>
            <p>Please respond at your earliest convenience.</p>
            <p>Thank you,<br/>Gail Infusion Centre</p>`,
          related_entity_type: "referral",
          related_entity_id: referral.id,
        },
      })
      .catch((err) => console.error("Info-request email failed (non-blocking):", err));

    await handleTransition("info_requested", { skipNotify: true });
  };

  const canConvert = referral.status === "accepted" && !!linkedPatientId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Review Referral
            <Badge
              style={{ backgroundColor: status.color + "20", color: status.color, borderColor: status.color }}
              className="border"
            >
              {status.label}
            </Badge>
            {linkedPatientId && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Patient linked
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="patient">
              Patient Match
              {linkedPatientId && <CheckCircle className="h-3 w-3 ml-1 text-primary" />}
            </TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Patient</p>
                <p className="font-medium">{referral.patient_first_name} {referral.patient_last_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Referring Doctor</p>
                <p className="font-medium">{referral.doctor_display_name || "—"}</p>
                {(referral.doctors as any)?.specialisation && (
                  <p className="text-xs text-muted-foreground">{(referral.doctors as any).specialisation}</p>
                )}
                {(referral.doctors as any)?.email && (
                  <p className="text-xs text-muted-foreground">{(referral.doctors as any).email}</p>
                )}
              </div>
              {referral.patient_email && (
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p>{referral.patient_email}</p>
                </div>
              )}
              {referral.patient_phone && (
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p>{referral.patient_phone}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">Urgency</p>
                <Badge variant={referral.urgency === "urgent" ? "destructive" : "secondary"}>
                  {referral.urgency}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Submitted</p>
                <p>{format(new Date(referral.created_at), "dd MMM yyyy HH:mm")}</p>
              </div>
            </div>

            <Separator />

            {referral.diagnosis && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Diagnosis</p>
                <p className="text-sm">{referral.diagnosis}</p>
              </div>
            )}
            {referral.treatment_requested && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Treatment Requested</p>
                <p className="text-sm">{referral.treatment_requested}</p>
              </div>
            )}
            {referral.prescription_notes && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Prescription Notes</p>
                <p className="text-sm">{referral.prescription_notes}</p>
              </div>
            )}

            <Separator />

            <div>
              <Label>Review Notes</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this referral..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Notes are saved when you take an action below.
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">History</p>
              <ReferralStatusTimeline referralId={referral.id} createdAt={referral.created_at} />
            </div>
          </TabsContent>

          <TabsContent value="patient" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Search for an existing patient to link this referral, or create a new patient record from the referral data.
              Linking is saved immediately.
            </p>
            <PatientMatcher
              firstName={referral.patient_first_name}
              lastName={referral.patient_last_name}
              email={referral.patient_email}
              phone={referral.patient_phone}
              currentPatientId={linkedPatientId}
              onMatch={handleLinkPatient}
              onCreatePatient={async () => {
                try {
                  const patient = await createPatient.mutateAsync({
                    referralId: referral.id,
                    firstName: referral.patient_first_name,
                    lastName: referral.patient_last_name,
                    email: referral.patient_email,
                    phone: referral.patient_phone,
                    medicalAidScheme: referral.medical_aid_scheme,
                    medicalAidNumber: referral.medical_aid_number,
                    medicalAidMainMember: referral.medical_aid_main_member,
                  });
                  toast.success(`Patient record created for ${referral.patient_first_name} ${referral.patient_last_name}`);
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-4">
            {/* Convert CTA — surfaces immediately when accepted + linked */}
            {canConvert && (
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Ready to convert</p>
                <p className="text-xs text-muted-foreground">
                  This referral is accepted and linked to a patient. Create a Treatment Course to schedule sessions.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onConvertToCourse(referral, linkedPatientId!);
                  }}
                >
                  Convert to Treatment Course →
                </Button>
              </div>
            )}

            {referral.status === "under_review" && !linkedPatientId && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">Link a patient before accepting</p>
                  <p className="text-muted-foreground">
                    Use the <strong>Patient Match</strong> tab to link an existing record or create a new one.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Available Actions</p>

              {allowedTransitions.map((t) => {
                const isAccept = t.to_status === "accepted";
                const isStartReview = t.to_status === "under_review";
                const isReject = t.to_status === "rejected";
                const isCancel = t.to_status === "cancelled";
                const isInfoRequest = t.to_status === "info_requested";
                const isConvert = t.to_status === "converted_to_course";
                const isInfoReceived = t.to_status === "under_review" && referral.status === "info_requested";

                // Hide the dictionary "Convert" — handled by dedicated CTA above
                if (isConvert) return null;

                let icon: JSX.Element = <ArrowRight className="h-4 w-4" />;
                let variant: "default" | "destructive" | "outline" | "secondary" = "outline";

                if (isAccept) {
                  icon = <CheckCircle className="h-4 w-4" />;
                  variant = "default";
                } else if (isReject || isCancel) {
                  icon = <XCircle className="h-4 w-4" />;
                  variant = "destructive";
                } else if (isInfoRequest) {
                  icon = <MessageSquare className="h-4 w-4" />;
                  variant = "secondary";
                } else if (isStartReview || isInfoReceived) {
                  icon = <ArrowRight className="h-4 w-4" />;
                  variant = "default";
                }

                if (isInfoRequest) {
                  return (
                    <div key={t.to_status} className="space-y-2 border rounded-lg p-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {t.label || t.display_label}
                      </p>
                      <Textarea
                        placeholder="Describe what information is needed from the doctor..."
                        value={infoRequestMessage}
                        onChange={(e) => setInfoRequestMessage(e.target.value)}
                        rows={2}
                      />
                      <Button
                        onClick={handleRequestInfo}
                        disabled={!infoRequestMessage.trim() || pendingTo === "info_requested"}
                        size="sm"
                        variant="secondary"
                      >
                        {pendingTo === "info_requested" && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Send Request & Update Status
                      </Button>
                    </div>
                  );
                }

                const acceptDisabled = isAccept && !linkedPatientId;
                const isPending = pendingTo === t.to_status;

                return (
                  <Button
                    key={t.to_status}
                    variant={variant}
                    className="w-full justify-start gap-2"
                    onClick={() => handleTransition(t.to_status)}
                    disabled={isPending || acceptDisabled || updateStatus.isPending}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
                    {t.label || t.display_label}
                    {acceptDisabled && (
                      <span className="ml-auto text-xs opacity-70">Link a patient first</span>
                    )}
                  </Button>
                );
              })}

              {allowedTransitions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No further transitions available for this status.
                </p>
              )}
            </div>

            <Separator />

            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
