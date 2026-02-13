import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

interface JobCardKetaminePanelProps {
  treatmentId: string;
  treatmentStartedAt: string | null;
}

const alertnessLabels = ["1 - Unresponsive", "2 - Drowsy", "3 - Alert", "4 - Agitated", "5 - Very Agitated"];
const dissociationLabels = ["0 - None", "1 - Mild", "2 - Moderate", "3 - Significant", "4 - Severe"];

/** Large tap-to-select button grid for gloved-hand use */
function TapGrid({
  label,
  subLabel,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  subLabel?: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <Label className="text-base font-medium">{label}</Label>
      {subLabel && <p className="text-sm text-muted-foreground mb-2">{subLabel}</p>}
      <div className="flex flex-wrap gap-2 mt-1">
        {values.map((v) => (
          <Button
            key={v}
            type="button"
            variant={value === v ? "default" : "outline"}
            className={cn("h-12 min-w-[48px] px-3 text-lg font-semibold", value === v && "ring-2 ring-primary ring-offset-2")}
            onClick={() => onChange(v)}
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
}

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
            <Badge variant="outline" className="text-sm">+{minutesFromStart} min</Badge>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12">
              {formOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            <TapGrid
              label="Alertness (1-5)"
              subLabel={alertnessLabels[form.alertness_score - 1]}
              min={1} max={5} value={form.alertness_score}
              onChange={(v) => setForm((f) => ({ ...f, alertness_score: v }))}
            />

            <TapGrid
              label={`Mood: ${form.mood_score}`}
              min={1} max={10} value={form.mood_score}
              onChange={(v) => setForm((f) => ({ ...f, mood_score: v }))}
            />

            <TapGrid
              label={`Pain: ${form.pain_score}`}
              min={0} max={10} value={form.pain_score}
              onChange={(v) => setForm((f) => ({ ...f, pain_score: v }))}
            />

            <TapGrid
              label="Dissociation Level (0-4)"
              subLabel={dissociationLabels[form.dissociation_level]}
              min={0} max={4} value={form.dissociation_level}
              onChange={(v) => setForm((f) => ({ ...f, dissociation_level: v }))}
            />

            <TapGrid
              label={`Anxiety: ${form.anxiety_score}`}
              min={0} max={10} value={form.anxiety_score}
              onChange={(v) => setForm((f) => ({ ...f, anxiety_score: v }))}
            />

            {/* Nausea */}
            <div className="flex items-center gap-3">
              <Checkbox id="ket-nausea" checked={form.nausea_present} onCheckedChange={(checked) => setForm((f) => ({ ...f, nausea_present: !!checked }))} className="h-7 w-7" />
              <Label htmlFor="ket-nausea" className="text-base cursor-pointer">Nausea Present</Label>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-base font-medium">Notes</Label>
              <Textarea className="mt-1 min-h-[80px] text-base" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any observations..." />
            </div>

            <Button onClick={handleSubmit} className="w-full h-14 text-base" disabled={addEntry.isPending}>
              Record Entry
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* History */}
      {entries && entries.length > 0 && (
        <CardContent className="pt-0">
          <div className="border-t pt-3">
            <p className="text-sm font-medium text-muted-foreground mb-2">History ({entries.length} entries)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm">+{entry.minutes_from_start} min</Badge>
                    <span className="text-sm text-muted-foreground">{format(new Date(entry.recorded_at), "HH:mm")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-sm">
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
          </div>
        </CardContent>
      )}
    </Card>
  );
}
