import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useTreatment, useKetamineMonitoring, useAddKetamineEntry } from "@/hooks/useTreatments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import { ArrowLeft, Brain, Activity } from "lucide-react";

export default function NurseKetamineMonitoring() {
  const { treatmentId } = useParams<{ treatmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: treatment } = useTreatment(treatmentId);
  const { data: entries } = useKetamineMonitoring(treatmentId);
  const addEntry = useAddKetamineEntry();

  const [form, setForm] = useState({
    alertness_score: 3,
    mood_score: 5,
    pain_score: 5,
    dissociation_level: 0,
    anxiety_score: 5,
    nausea_present: false,
    notes: "",
  });

  const minutesFromStart = treatment?.started_at
    ? differenceInMinutes(new Date(), new Date(treatment.started_at))
    : 0;

  const handleSubmit = async () => {
    if (!user?.id || !treatmentId) return;
    try {
      await addEntry.mutateAsync({
        treatment_id: treatmentId,
        minutes_from_start: minutesFromStart,
        alertness_score: form.alertness_score,
        mood_score: form.mood_score,
        pain_score: form.pain_score,
        dissociation_level: form.dissociation_level,
        anxiety_score: form.anxiety_score,
        nausea_present: form.nausea_present,
        notes: form.notes || null,
        recorded_by: user.id,
      });
      setForm({ alertness_score: 3, mood_score: 5, pain_score: 5, dissociation_level: 0, anxiety_score: 5, nausea_present: false, notes: "" });
      toast({ title: "Monitoring entry recorded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const alertnessLabels = ["1 - Unresponsive", "2 - Drowsy", "3 - Alert", "4 - Agitated", "5 - Very Agitated"];
  const dissociationLabels = ["0 - None", "1 - Mild", "2 - Moderate", "3 - Significant", "4 - Severe"];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(`/nurse/treatment/${treatmentId}`)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to treatment
      </Button>

      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-amber-600" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ketamine Monitoring</h1>
          <p className="text-muted-foreground">{minutesFromStart} minutes into treatment</p>
        </div>
      </div>

      {/* New entry form */}
      <Card>
        <CardHeader>
          <CardTitle>New Monitoring Entry (+{minutesFromStart} min)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alertness */}
          <div>
            <Label className="text-base font-medium">Alertness (1-5)</Label>
            <p className="text-sm text-muted-foreground mb-2">{alertnessLabels[form.alertness_score - 1]}</p>
            <Slider
              value={[form.alertness_score]}
              onValueChange={([v]) => setForm((f) => ({ ...f, alertness_score: v }))}
              min={1} max={5} step={1}
              className="py-2"
            />
          </div>

          {/* Mood */}
          <div>
            <Label className="text-base font-medium">Mood (1-10): {form.mood_score}</Label>
            <Slider
              value={[form.mood_score]}
              onValueChange={([v]) => setForm((f) => ({ ...f, mood_score: v }))}
              min={1} max={10} step={1}
              className="py-2"
            />
          </div>

          {/* Pain */}
          <div>
            <Label className="text-base font-medium">Pain (0-10): {form.pain_score}</Label>
            <Slider
              value={[form.pain_score]}
              onValueChange={([v]) => setForm((f) => ({ ...f, pain_score: v }))}
              min={0} max={10} step={1}
              className="py-2"
            />
          </div>

          {/* Dissociation */}
          <div>
            <Label className="text-base font-medium">Dissociation Level (0-4)</Label>
            <p className="text-sm text-muted-foreground mb-2">{dissociationLabels[form.dissociation_level]}</p>
            <Slider
              value={[form.dissociation_level]}
              onValueChange={([v]) => setForm((f) => ({ ...f, dissociation_level: v }))}
              min={0} max={4} step={1}
              className="py-2"
            />
          </div>

          {/* Anxiety */}
          <div>
            <Label className="text-base font-medium">Anxiety (0-10): {form.anxiety_score}</Label>
            <Slider
              value={[form.anxiety_score]}
              onValueChange={([v]) => setForm((f) => ({ ...f, anxiety_score: v }))}
              min={0} max={10} step={1}
              className="py-2"
            />
          </div>

          {/* Nausea */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="nausea"
              checked={form.nausea_present}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, nausea_present: !!checked }))}
              className="h-6 w-6"
            />
            <Label htmlFor="nausea" className="text-base cursor-pointer">Nausea Present</Label>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-base font-medium">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any observations..." />
          </div>

          <Button onClick={handleSubmit} className="w-full h-14 text-lg" disabled={addEntry.isPending}>
            Record Entry
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      {entries && entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monitoring History ({entries.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">+{entry.minutes_from_start} min</Badge>
                    <span className="text-sm text-muted-foreground">{format(new Date(entry.recorded_at), "HH:mm")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Alert: {entry.alertness_score}/5</div>
                    <div>Mood: {entry.mood_score}/10</div>
                    <div>Pain: {entry.pain_score}/10</div>
                    <div>Dissoc: {entry.dissociation_level}/4</div>
                    <div>Anxiety: {entry.anxiety_score ?? "–"}/10</div>
                    <div>Nausea: {entry.nausea_present ? "Yes" : "No"}</div>
                  </div>
                  {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
