import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctors";
import { useMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useMessages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChatThread } from "@/components/messaging/ChatThread";
import { ChatInput } from "@/components/messaging/ChatInput";
import { ArrowLeft, MessageCircle, FileText, Activity, Paperclip } from "lucide-react";
import { DoctorDocumentUpload } from "@/components/doctor/DoctorDocumentUpload";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  info_requested: "bg-orange-100 text-orange-800",
  accepted: "bg-blue-100 text-blue-800",
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

export default function DoctorReferralDetail() {
  const { referralId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: doctor } = useDoctorProfile();
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [activeTab, setActiveTab] = useState("details");

  const { data: referral, isLoading } = useQuery({
    queryKey: ["doctor-referral", referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("id", referralId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!referralId,
  });

  // Doctor-scoped messages with admin (filtered to this referral via context not stored — use full thread)
  const { data: messages = [], isLoading: messagesLoading } = useMessages({
    doctorId: doctor?.id,
    conversationType: "admin_doctor",
  });

  // Mark unread as read
  useEffect(() => {
    if (!messages.length || !user) return;
    const unread = messages.filter((m) => !m.is_read && m.sender_id !== user.id);
    if (unread.length > 0) {
      markRead.mutate({ messageIds: unread.map((m) => m.id) });
    }
  }, [messages, user]);

  const handleSend = (content: string) => {
    if (!user || !doctor?.id) return;
    sendMessage.mutate(
      {
        conversation_type: "admin_doctor",
        doctor_id: doctor.id,
        sender_id: user.id,
        sender_role: "doctor",
        content: `[Re: ${referral?.patient_first_name} ${referral?.patient_last_name}] ${content}`,
      },
      { onError: (e: any) => toast({ title: e.message, variant: "destructive" }) }
    );
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading referral...</div>;
  }

  if (!referral) {
    return <div className="text-center py-12 text-muted-foreground">Referral not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/doctor/referrals")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Referrals
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Referral: {referral.patient_first_name} {referral.patient_last_name}
          </h1>
          <p className="text-muted-foreground">
            Submitted {format(new Date(referral.created_at), "dd MMM yyyy HH:mm")}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={referral.urgency === "urgent" ? "destructive" : "secondary"}>
            {referral.urgency}
          </Badge>
          <Badge className={statusColors[referral.status] || ""}>{referral.status}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details" className="gap-2">
            <FileText className="h-4 w-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2">
            <Activity className="h-4 w-4" /> Status & Updates
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageCircle className="h-4 w-4" /> Messages
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <Paperclip className="h-4 w-4" /> Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Name" value={`${referral.patient_first_name} ${referral.patient_last_name}`} />
              <Field label="Email" value={referral.patient_email} />
              <Field label="Phone" value={referral.patient_phone} />
              <Field label="Medical Aid" value={referral.medical_aid_scheme} />
              <Field label="Medical Aid #" value={referral.medical_aid_number} />
              <Field label="Main Member" value={referral.medical_aid_main_member} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clinical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Diagnosis" value={referral.diagnosis} block />
              <Field label="Treatment Requested" value={referral.treatment_requested} block />
              <Field label="ICD-10 Codes" value={referral.icd10_codes?.join(", ")} />
              <Field label="Clinical History" value={referral.clinical_history} block />
              <Field label="Current Medications" value={referral.current_medications} block />
              <Field label="Reason for Referral" value={referral.reason_for_referral} block />
              <Field label="Prescription Notes" value={referral.prescription_notes} block />
            </CardContent>
          </Card>

          {referral.referral_document_path && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground">Document: {referral.referral_document_path}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge className={statusColors[referral.status] || ""}>{referral.status}</Badge>
                {referral.reviewed_at && (
                  <span className="text-sm text-muted-foreground">
                    Reviewed {format(new Date(referral.reviewed_at), "dd MMM yyyy HH:mm")}
                  </span>
                )}
              </div>
              <Separator />
              {referral.notes ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{referral.notes}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes from the admin team yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Submitted — {format(new Date(referral.created_at), "dd MMM yyyy HH:mm")}</span>
              </div>
              {referral.reviewed_at && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>
                    Status updated to <strong>{referral.status}</strong> —{" "}
                    {format(new Date(referral.reviewed_at), "dd MMM yyyy HH:mm")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <Card className="flex flex-col h-[calc(100vh-380px)] min-h-[400px]">
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Conversation with Admin Team
              </CardTitle>
            </CardHeader>
            <ChatThread
              messages={messages}
              currentUserId={user?.id || ""}
              isLoading={messagesLoading}
            />
            <ChatInput
              onSend={handleSend}
              disabled={sendMessage.isPending}
              placeholder={`Message about ${referral.patient_first_name} ${referral.patient_last_name}...`}
            />
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {referral.patient_id ? (
            <DoctorDocumentUpload patientId={referral.patient_id} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Documents can be uploaded once the clinic has reviewed the referral and created the
                patient record. Until then, please use the Messages tab to send any additional
                information.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value, block }: { label: string; value?: string | null; block?: boolean }) {
  if (!value) {
    return (
      <div className={block ? "col-span-2" : ""}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-muted-foreground italic">—</p>
      </div>
    );
  }
  return (
    <div className={block ? "col-span-2" : ""}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}
