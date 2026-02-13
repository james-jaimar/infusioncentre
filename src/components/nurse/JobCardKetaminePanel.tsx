import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useKetamineMonitoring, useAddKetamineEntry } from "@/hooks/useTreatments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";

interface JobCardKetaminePanelProps {
  treatmentId: string;
  treatmentStartedAt: string | null;
}

const alertnessLabels = ["1 - Unresponsive", "2 - Drowsy", "3 - Alert", "4 - Agitated", "5 - Very Agitated"];
const dissociationLabels = ["0 - None", "1 - Mild", "2 - Moderate", "3 - Significant", "4 - Severe"];

export default function JobCardKetaminePanel({ treatmentId, treatmentStartedAt }: JobCardKetaminePanelProps) {
  const { user } = useAuth();
  const { data: entries } = useKetamineMonitoring(treatmentId);
  const addEntry = useAddKetamineEntry();
  const [formOpen, setFormOpen] = useState(true);

  const [form, setForm] = useState({
    alertness_score: 3,
    mood_score: 5,
    pain_score: 5,
    dissociation_level: 0,
    anxiety_score: 5,
    nausea_present: false,
    notes: "",
  });

  const minutesFromStart = treatmentStartedAt
    ? differenceInMinutes(new Date(), new Date(treatmentStartedAt))
    : 0;

  const handleSubmit = async () => {
    if (!user?.id) return;
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

  return (
    <Card className="border-amber-300">
      <Collapsible open={formOpen} onOpenChange={setFormOpen}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Ketamine Monitoring</CardTitle>
            <Badge variant="outline" className="text-xs">+{minutesFromStart} min</Badge>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-5 pt-0">
            {/* Alertness */}
            <div>
              <Label className="text-sm font-medium">Alertness (1-5)</Label>
              <p className="text-xs text-muted-foreground mb-1">{alertnessLabels[form.alertness_score - 1]}</p>
              <Slider value={[form.alertness_score]} onValueChange={([v]) => setForm((f) => ({ ...f, alertness_score: v }))} min={1} max={5} step={1} className="py-2" />
            </div>

            {/* Mood */}
            <div>
              <Label className="text-sm font-medium">Mood (1-10): {form.mood_score}</Label>
              <Slider value={[form.mood_score]} onValueChange={([v]) => setForm((f) => ({ ...f, mood_score: v }))} min={1} max={10} step={1} className="py-2" />
            </div>

            {/* Pain */}
            <div>
              <Label className="text-sm font-medium">Pain (0-10): {form.pain_score}</Label>
              <Slider value={[form.pain_score]} onValueChange={([v]) => setForm((f) => ({ ...f, pain_score: v }))} min={0} max={10} step={1} className="py-2" />
            </div>

            {/* Dissociation */}
            <div>
              <Label className="text-sm font-medium">Dissociation Level (0-4)</Label>
              <p className="text-xs text-muted-foreground mb-1">{dissociationLabels[form.dissociation_level]}</p>
              <Slider value={[form.dissociation_level]} onValueChange={([v]) => setForm((f) => ({ ...f, dissociation_level: v }))} min={0} max={4} step={1} className="py-2" />
            </div>

            {/* Anxiety */}
            <div>
              <Label className="text-sm font-medium">Anxiety (0-10): {form.anxiety_score}</Label>
              <Slider value={[form.anxiety_score]} onValueChange={([v]) => setForm((f) => ({ ...f, anxiety_score: v }))} min={0} max={10} step={1} className="py-2" />
            </div>

            {/* Nausea */}
            <div className="flex items-center gap-3">
              <Checkbox id="ket-nausea" checked={form.nausea_present} onCheckedChange={(checked) => setForm((f) => ({ ...f, nausea_present: !!checked }))} className="h-6 w-6" />
              <Label htmlFor="ket-nausea" className="text-sm cursor-pointer">Nausea Present</Label>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any observations..." />
            </div>

            <Button onClick={handleSubmit} className="w-full h-12" disabled={addEntry.isPending}>
              Record Entry
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* History */}
      {entries && entries.length > 0 && (
        <CardContent className="pt-0">
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">History ({entries.length} entries)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">+{entry.minutes_from_start} min</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(entry.recorded_at), "HH:mm")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div>Alert: {entry.alertness_score}/5</div>
                    <div>Mood: {entry.mood_score}/10</div>
                    <div>Pain: {entry.pain_score}/10</div>
                    <div>Dissoc: {entry.dissociation_level}/4</div>
                    <div>Anxiety: {entry.anxiety_score ?? "–"}/10</div>
                    <div>Nausea: {entry.nausea_present ? "Yes" : "No"}</div>
                  </div>
                  {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
