import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateReferralStatus, useCreatePatientFromReferral } from "@/hooks/useReferrals";
import { useAllowedTransitions, useStatusDisplay } from "@/hooks/useStatusDictionaries";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PatientMatcher } from "./PatientMatcher";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CheckCircle, XCircle, MessageSquare, ArrowRight } from "lucide-react";

interface Props {
  referral: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToCourse: (referral: any, patientId: string) => void;
}

export function ReferralTriageDialog({ referral, open, onOpenChange, onConvertToCourse }: Props) {
  const updateStatus = useUpdateReferralStatus();
  const createPatient = useCreatePatientFromReferral();
  const { user } = useAuth();
  const { toast } = useToast();
  const allowedTransitions = useAllowedTransitions("referral", referral?.status || "pending");
  const getStatus = useStatusDisplay("referral");

  const [activeTab, setActiveTab] = useState("details");
  const [reviewNotes, setReviewNotes] = useState(referral?.notes || "");
  const [linkedPatientId, setLinkedPatientId] = useState<string | null>(referral?.patient_id || null);
  const [infoRequestMessage, setInfoRequestMessage] = useState("");

  if (!referral) return null;

  const status = getStatus(referral.status);

  const handleTransition = async (toStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        id: referral.id,
        status: toStatus,
        reviewed_by: user?.id,
        notes: reviewNotes,
        patient_id: linkedPatientId || undefined,
      });

      // Send doctor notification
      try {
        const doctorEmail = (referral.doctors as any)?.email;
        if (doctorEmail) {
          const statusLabel = getStatus(toStatus).label;
          await supabase.functions.invoke("send-email", {
            body: {
              to: doctorEmail,
              subject: `Referral Update: ${referral.patient_first_name} ${referral.patient_last_name} — ${statusLabel}`,
              html: `<p>Dear ${(referral.doctors as any)?.practice_name || "Doctor"},</p>
                <p>Your referral for <strong>${referral.patient_first_name} ${referral.patient_last_name}</strong> has been updated to: <strong>${statusLabel}</strong>.</p>
                ${reviewNotes ? `<p><strong>Notes:</strong> ${reviewNotes}</p>` : ""}
                <p>Thank you,<br/>Gail Infusion Centre</p>`,
              related_entity_type: "referral",
              related_entity_id: referral.id,
            },
          });
        }
      } catch {
        // Notification failure shouldn't block the transition
      }

      toast({ title: `Referral ${getStatus(toStatus).label.toLowerCase()}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const handleRequestInfo = async () => {
    const doctorEmail = (referral.doctors as any)?.email;
    if (!doctorEmail || !infoRequestMessage) {
      toast({ title: "Doctor email and message are required", variant: "destructive" });
      return;
    }

    try {
      await supabase.functions.invoke("send-email", {
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
      });

      await handleTransition("info_requested");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const canConvert = referral.status === "accepted" && linkedPatientId;

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
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="patient">Patient Match</TabsTrigger>
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
                <p className="font-medium">{(referral.doctors as any)?.practice_name || "—"}</p>
                {(referral.doctors as any)?.specialisation && (
                  <p className="text-xs text-muted-foreground">{(referral.doctors as any).specialisation}</p>
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
            </div>
          </TabsContent>

          <TabsContent value="patient" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Search for an existing patient to link this referral, or create a new patient record from the referral data.
            </p>
            <PatientMatcher
              firstName={referral.patient_first_name}
              lastName={referral.patient_last_name}
              email={referral.patient_email}
              phone={referral.patient_phone}
              currentPatientId={linkedPatientId}
              onMatch={setLinkedPatientId}
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
                  setLinkedPatientId(patient.id);
                  toast({ title: `Patient record created for ${referral.patient_first_name} ${referral.patient_last_name}` });
                } catch (e: any) {
                  toast({ title: e.message, variant: "destructive" });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-4">
            {/* Status transition actions */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Available Actions</p>

              {allowedTransitions.map((t) => {
                const isAccept = t.to_status === "accepted" || t.to_status === "under_review";
                const isReject = t.to_status === "rejected" || t.to_status === "cancelled";
                const isInfoRequest = t.to_status === "info_requested";

                let icon = <ArrowRight className="h-4 w-4" />;
                let variant: "default" | "destructive" | "outline" | "secondary" = "outline";

                if (isAccept) {
                  icon = <CheckCircle className="h-4 w-4" />;
                  variant = "default";
                } else if (isReject) {
                  icon = <XCircle className="h-4 w-4" />;
                  variant = "destructive";
                } else if (isInfoRequest) {
                  icon = <MessageSquare className="h-4 w-4" />;
                  variant = "secondary";
                }

                if (isInfoRequest) {
                  return (
                    <div key={t.to_status} className="space-y-2 border rounded-lg p-3">
                      <Button
                        variant={variant}
                        className="w-full justify-start gap-2"
                        disabled
                      >
                        {icon}
                        {t.label || t.display_label}
                      </Button>
                      <Textarea
                        placeholder="Describe what information is needed from the doctor..."
                        value={infoRequestMessage}
                        onChange={(e) => setInfoRequestMessage(e.target.value)}
                        rows={2}
                      />
                      <Button
                        onClick={handleRequestInfo}
                        disabled={!infoRequestMessage || updateStatus.isPending}
                        size="sm"
                      >
                        Send Request & Update Status
                      </Button>
                    </div>
                  );
                }

                return (
                  <Button
                    key={t.to_status}
                    variant={variant}
                    className="w-full justify-start gap-2"
                    onClick={() => handleTransition(t.to_status)}
                    disabled={updateStatus.isPending}
                  >
                    {icon}
                    {t.label || t.display_label}
                  </Button>
                );
              })}

              {allowedTransitions.length === 0 && (
                <p className="text-sm text-muted-foreground">No further transitions available for this status.</p>
              )}
            </div>

            {/* Convert to course action */}
            {canConvert && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Convert to Treatment Course</p>
                  <p className="text-xs text-muted-foreground">
                    This referral has been accepted and linked to a patient. You can now create a Treatment Course.
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
