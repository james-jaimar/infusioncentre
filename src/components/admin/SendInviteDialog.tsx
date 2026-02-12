import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Copy, Loader2, CheckCircle2, Clock, XCircle, RotateCw } from "lucide-react";
import { usePatientInvites, useSendInvite, useRevokeInvite, type PatientInvite } from "@/hooks/usePatientInvites";

interface SendInviteDialogProps {
  patientId: string;
  patientEmail: string | null;
  patientPhone: string | null;
  patientName: string;
}

export default function SendInviteDialog({
  patientId,
  patientEmail,
  patientPhone,
  patientName,
}: SendInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(patientEmail || "");
  const [phone, setPhone] = useState(patientPhone || "");

  const { data: invites, isLoading: invitesLoading } = usePatientInvites(patientId);
  const sendInvite = useSendInvite();
  const revokeInvite = useRevokeInvite();

  const pendingInvite = invites?.find((i) => i.status === "pending");

  const handleSendInvite = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    try {
      const result = await sendInvite.mutateAsync({
        patient_id: patientId,
        email,
        phone: phone || undefined,
      });
      const inviteUrl = `${window.location.origin}/invite/${result.invite.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      if (result.email_sent) {
        toast.success("Invite email sent & link copied!", {
          description: `A branded invitation was emailed to ${email}.`,
        });
      } else {
        toast.success("Invite created! Link copied to clipboard.", {
          description: "Email delivery failed — share the link manually.",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    }
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard");
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeInvite.mutateAsync({ inviteId, patientId });
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "expired": return <Clock className="h-4 w-4 text-amber-500" />;
      case "revoked": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const isExpired = (invite: PatientInvite) =>
    invite.status === "pending" && new Date(invite.expires_at) < new Date();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Send Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite {patientName}</DialogTitle>
          <DialogDescription>
            Generate a secure link for the patient to register and complete their onboarding forms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-phone">Phone (optional)</Label>
            <Input
              id="invite-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27..."
            />
          </div>

          <Button
            onClick={handleSendInvite}
            disabled={sendInvite.isPending || !email}
            className="w-full"
          >
            {sendInvite.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Generate & Copy Invite Link
          </Button>

          {/* Invite History */}
          {invites && invites.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-muted-foreground">Invite History</Label>
              {invites.slice(0, 5).map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <div className="flex items-center gap-2">
                    {statusIcon(isExpired(invite) ? "expired" : invite.status)}
                    <span className="text-muted-foreground">
                      {new Date(invite.created_at).toLocaleDateString("en-ZA")}
                    </span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {isExpired(invite) ? "expired" : invite.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {invite.status === "pending" && !isExpired(invite) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleCopyLink(invite.token)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive"
                          onClick={() => handleRevoke(invite.id)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {(invite.status === "expired" || invite.status === "revoked" || isExpired(invite)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={handleSendInvite}
                        disabled={sendInvite.isPending}
                      >
                        <RotateCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
