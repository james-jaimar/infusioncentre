import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Save, Send, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useClinicSettings,
  useUpdateClinicSetting,
} from "@/hooks/useClinicSettings";
import { useSendTestSms, useRunReminderDispatchNow } from "@/hooks/useSendSms";

const SMS_KEYS = [
  "sms_enabled",
  "sms_sender_id",
  "sms_reminder_send_hour",
  "sms_reminder_template",
] as const;

type SmsKey = typeof SMS_KEYS[number];

export default function SmsSettingsTab() {
  const { data: settings = [], isLoading } = useClinicSettings();
  const updateSetting = useUpdateClinicSetting();
  const sendTest = useSendTestSms();
  const runNow = useRunReminderDispatchNow();

  const smsSettings = useMemo(
    () => settings.filter((s) => SMS_KEYS.includes(s.key as SmsKey)),
    [settings],
  );

  const [vals, setVals] = useState<Record<string, unknown>>({});
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    const next: Record<string, unknown> = {};
    smsSettings.forEach((s) => { next[s.key] = s.value; });
    setVals(next);
  }, [smsSettings]);

  const setVal = (k: SmsKey, v: unknown) => setVals((p) => ({ ...p, [k]: v }));

  const dirty = smsSettings.some(
    (s) => JSON.stringify(vals[s.key]) !== JSON.stringify(s.value),
  );

  const handleSave = async () => {
    try {
      for (const s of smsSettings) {
        if (JSON.stringify(vals[s.key]) !== JSON.stringify(s.value)) {
          await updateSetting.mutateAsync({ key: s.key, value: vals[s.key] });
        }
      }
      toast.success("SMS settings saved");
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    }
  };

  const handleTest = async () => {
    if (!testPhone) { toast.error("Enter a phone number"); return; }
    const tpl = (vals.sms_reminder_template as string) || "Test message from clinic SMS.";
    const preview = tpl
      .replace(/\{\{first_name\}\}/g, "Test")
      .replace(/\{\{time\}\}/g, "10:00")
      .replace(/\{\{date\}\}/g, "today")
      .replace(/\{\{treatment_type\}\}/g, "Iron Infusion")
      .replace(/\{\{clinic_name\}\}/g, "The Johannesburg Infusion Centre");
    try {
      await sendTest.mutateAsync({
        to: testPhone,
        message: `[TEST] ${preview}`,
        sender_id: (vals.sms_sender_id as string) || undefined,
      });
      toast.success("Test SMS sent");
    } catch (e) {
      toast.error(`Test failed: ${(e as Error).message}`);
    }
  };

  const handleRunNow = async () => {
    try {
      const res = await runNow.mutateAsync();
      toast.success(`Dispatch finished: ${res.sent} sent, ${res.skipped} skipped, ${res.failed} failed`);
    } catch (e) {
      toast.error(`Dispatch failed: ${(e as Error).message}`);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-8">Loading…</p>;
  }

  const enabled = vals.sms_enabled === true;

  return (
    <div className="space-y-4">
      {dirty && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSetting.isPending}>
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Appointment SMS Reminders
          </CardTitle>
          <CardDescription>
            Powered by SMSPortal. Each appointment is reminded once, ~24 hours in advance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Send 24-hour SMS reminders</Label>
              <p className="text-xs text-muted-foreground">
                When off, no reminder texts are sent automatically.
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => setVal("sms_enabled", v)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Sender ID</Label>
              <Input
                maxLength={11}
                value={(vals.sms_sender_id as string) ?? ""}
                onChange={(e) => setVal("sms_sender_id", e.target.value)}
                placeholder="InfusionCtr"
              />
              <p className="text-[11px] text-muted-foreground">
                Up to 11 characters. Shown as the SMS sender.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Send hour (SAST, 0–23)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={Number(vals.sms_reminder_send_hour ?? 17)}
                onChange={(e) =>
                  setVal(
                    "sms_reminder_send_hour",
                    Math.max(0, Math.min(23, parseInt(e.target.value || "0", 10))),
                  )
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Reminders dispatch at this hour the day before the appointment.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reminder message template</Label>
            <Textarea
              rows={3}
              value={(vals.sms_reminder_template as string) ?? ""}
              onChange={(e) => setVal("sms_reminder_template", e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Merge tags:{" "}
              <code className="text-[10px]">{`{{first_name}}`}</code>,{" "}
              <code className="text-[10px]">{`{{time}}`}</code>,{" "}
              <code className="text-[10px]">{`{{date}}`}</code>,{" "}
              <code className="text-[10px]">{`{{treatment_type}}`}</code>,{" "}
              <code className="text-[10px]">{`{{clinic_name}}`}</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tools</CardTitle>
          <CardDescription>
            Send a one-off test SMS, or force the daily dispatcher to run now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Test phone number</Label>
              <Input
                placeholder="+27 82 123 4567"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <Button onClick={handleTest} disabled={sendTest.isPending}>
              <Send className="h-4 w-4 mr-2" /> Send test
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-sm font-medium">Run reminder dispatch now</p>
              <p className="text-xs text-muted-foreground">
                Sends SMS to every patient with an appointment tomorrow who hasn't been reminded yet.
              </p>
            </div>
            <Button variant="outline" onClick={handleRunNow} disabled={runNow.isPending}>
              <PlayCircle className="h-4 w-4 mr-2" /> Run now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}