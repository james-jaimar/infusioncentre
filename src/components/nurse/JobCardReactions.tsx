import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useTreatmentReactions, useAddReaction, useUpdateReaction } from "@/hooks/useTreatmentReactions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { REACTION_SYMPTOMS, REACTION_INTERVENTIONS, type ReactionOutcome } from "@/types/treatment";
import { useNavigate } from "react-router-dom";

interface JobCardReactionsProps {
  treatmentId: string;
  treatmentStartedAt: string | null;
  isCompleted?: boolean;
}

const SEVERITY_LABELS: Record<number, { label: string; description: string; color: string }> = {
  1: { label: "Grade 1 – Mild", description: "Transient reaction, no interruption needed", color: "bg-amber-100 text-amber-800" },
  2: { label: "Grade 2 – Moderate", description: "Therapy interruption required but responds to treatment", color: "bg-orange-100 text-orange-800" },
  3: { label: "Grade 3 – Severe", description: "Prolonged, not rapidly responsive, hospitalisation may be required", color: "bg-red-100 text-red-800" },
  4: { label: "Grade 4 – Life-threatening", description: "Life-threatening, urgent intervention required", color: "bg-red-200 text-red-900" },
};

const formatSymptom = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function JobCardReactions({ treatmentId, treatmentStartedAt, isCompleted }: JobCardReactionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: reactions } = useTreatmentReactions(treatmentId);
  const addReaction = useAddReaction();
  const updateReaction = useUpdateReaction();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    severity_grade: 1,
    symptoms: [] as string[],
    other_symptoms: "",
    intervention: [] as string[],
    intervention_details: "",
    outcome: "resolved" as ReactionOutcome,
    notes: "",
  });

  const calcMinutesFromStart = () => {
    if (!treatmentStartedAt) return 0;
    return Math.floor((Date.now() - new Date(treatmentStartedAt).getTime()) / 60000);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      await addReaction.mutateAsync({
        treatment_id: treatmentId,
        onset_at: new Date().toISOString(),
        onset_minutes_from_start: calcMinutesFromStart(),
        severity_grade: form.severity_grade,
        symptoms: form.symptoms,
        other_symptoms: form.other_symptoms || null,
        intervention: form.intervention,
        intervention_details: form.intervention_details || null,
        infusion_resumed: null,
        resumed_at_rate: null,
        outcome: form.outcome,
        resolved_at: form.outcome === "resolved" ? new Date().toISOString() : null,
        recorded_by: user.id,
        notes: form.notes || null,
      });
      setOpen(false);
      setForm({ severity_grade: 1, symptoms: [], other_symptoms: "", intervention: [], intervention_details: "", outcome: "resolved", notes: "" });
      toast({ title: "Reaction documented" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const hasActiveReaction = reactions?.some((r) => r.outcome === "ongoing");

  return (
    <Card className={hasActiveReaction ? "border-destructive bg-red-50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`h-5 w-5 ${hasActiveReaction ? "text-destructive" : "text-muted-foreground"}`} />
          <CardTitle className="text-base">Adverse Reactions</CardTitle>
          {hasActiveReaction && <Badge variant="destructive">ACTIVE</Badge>}
        </div>
        <div className="flex gap-2">
          {!isCompleted && (
            <>
              <Button size="sm" variant="outline" className="gap-1 h-11 min-w-[44px] border-destructive text-destructive hover:bg-red-50"
                onClick={() => navigate("/nurse/emergency")}>
                <AlertTriangle className="h-4 w-4" /> Emergency
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-1 h-11 min-w-[44px]">
                    <AlertTriangle className="h-4 w-4" /> Report Reaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Document Adverse Reaction</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    {/* Severity */}
                    <div>
                      <Label className="mb-2 block">Severity Grade (CTCAE)</Label>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((g) => (
                          <button
                            key={g}
                            onClick={() => setForm((f) => ({ ...f, severity_grade: g }))}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                              form.severity_grade === g ? "border-primary " + SEVERITY_LABELS[g].color : "border-transparent bg-muted/50"
                            }`}
                          >
                            <p className="font-medium text-sm">{SEVERITY_LABELS[g].label}</p>
                            <p className="text-xs text-muted-foreground">{SEVERITY_LABELS[g].description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div>
                      <Label className="mb-2 block">Symptoms</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {REACTION_SYMPTOMS.map((s) => (
                          <div key={s} className="flex items-center gap-2">
                            <Checkbox
                              id={`sym-${s}`}
                              checked={form.symptoms.includes(s)}
                              onCheckedChange={(checked) => {
                                setForm((f) => ({
                                  ...f,
                                  symptoms: checked ? [...f.symptoms, s] : f.symptoms.filter((x) => x !== s),
                                }));
                              }}
                              className="h-6 w-6"
                            />
                            <Label htmlFor={`sym-${s}`} className="text-sm cursor-pointer">{formatSymptom(s)}</Label>
                          </div>
                        ))}
                      </div>
                      {form.symptoms.includes("other") && (
                        <Input className="mt-2" placeholder="Describe other symptoms"
                          value={form.other_symptoms} onChange={(e) => setForm((f) => ({ ...f, other_symptoms: e.target.value }))} />
                      )}
                    </div>

                    {/* Interventions */}
                    <div>
                      <Label className="mb-2 block">Interventions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {REACTION_INTERVENTIONS.map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Checkbox
                              id={`int-${i}`}
                              checked={form.intervention.includes(i)}
                              onCheckedChange={(checked) => {
                                setForm((f) => ({
                                  ...f,
                                  intervention: checked ? [...f.intervention, i] : f.intervention.filter((x) => x !== i),
                                }));
                              }}
                              className="h-6 w-6"
                            />
                            <Label htmlFor={`int-${i}`} className="text-sm cursor-pointer">{formatSymptom(i)}</Label>
                          </div>
                        ))}
                      </div>
                      <Input className="mt-2" placeholder="Intervention details"
                        value={form.intervention_details} onChange={(e) => setForm((f) => ({ ...f, intervention_details: e.target.value }))} />
                    </div>

                    {/* Outcome */}
                    <div>
                      <Label>Outcome</Label>
                      <Select value={form.outcome} onValueChange={(v) => setForm((f) => ({ ...f, outcome: v as ReactionOutcome }))}>
                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="escalated">Escalated</SelectItem>
                          <SelectItem value="emergency_transfer">Emergency Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                    </div>
                  </div>
                  <Button onClick={handleSave} variant="destructive" className="w-full h-12 mt-2" disabled={form.symptoms.length === 0 || addReaction.isPending}>
                    Document Reaction
                  </Button>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reactions?.length ? (
          <div className="space-y-3">
            {reactions.map((r) => (
              <div key={r.id} className={`p-3 rounded-lg border ${r.outcome === "ongoing" ? "border-destructive bg-red-50" : "border-border"}`}>
                <div className="flex items-center justify-between mb-1">
                  <Badge className={SEVERITY_LABELS[r.severity_grade]?.color || ""}>
                    {SEVERITY_LABELS[r.severity_grade]?.label || `Grade ${r.severity_grade}`}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.onset_at), "HH:mm")} ({r.onset_minutes_from_start ?? "?"}min)
                  </span>
                </div>
                <p className="text-sm">{r.symptoms.map(formatSymptom).join(", ")}</p>
                {r.intervention.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Interventions: {r.intervention.map(formatSymptom).join(", ")}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs capitalize">{r.outcome.replace("_", " ")}</Badge>
                  {r.outcome === "ongoing" && !isCompleted && (
                    <Button size="sm" variant="outline" className="h-9"
                      onClick={async () => {
                        try {
                          await updateReaction.mutateAsync({
                            id: r.id,
                            data: { outcome: "resolved", resolved_at: new Date().toISOString() },
                          });
                          toast({ title: "Reaction marked as resolved" });
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        }
                      }}>
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3 text-sm">No adverse reactions documented.</p>
        )}
      </CardContent>
    </Card>
  );
}
