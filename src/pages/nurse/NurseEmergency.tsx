import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { title: "STOP the infusion immediately", detail: "Clamp the IV line. Do not remove the cannula." },
  { title: "Call for help", detail: "Alert the doctor and senior nurse. Call 112 / 10177 if needed." },
  { title: "Position the patient", detail: "Lay patient flat with legs elevated (unless respiratory distress — then sit upright)." },
  { title: "Administer Adrenaline", detail: "Adrenaline 1:1000, 0.5ml IM into mid-outer thigh. Repeat every 5 min if no improvement." },
  { title: "Monitor ABCs", detail: "Airway, Breathing, Circulation. Start CPR if cardiac arrest." },
  { title: "Oxygen", detail: "High-flow O₂ via non-rebreather mask at 15 L/min." },
  { title: "IV Fluid resuscitation", detail: "Normal saline 500ml–1000ml bolus if hypotensive." },
  { title: "Secondary medications", detail: "Hydrocortisone 200mg IV. Promethazine 25mg IV/IM." },
  { title: "Continuous monitoring", detail: "BP, HR, O₂ every 2–5 minutes. Document everything." },
  { title: "Transfer", detail: "Arrange emergency transfer to hospital if needed." },
];

export default function NurseEmergency() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-destructive text-2xl">
            <AlertTriangle className="h-8 w-8" />
            ANAPHYLAXIS EMERGENCY PROTOCOL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-6">
            <Button variant="destructive" size="lg" className="h-14 text-lg gap-2" asChild>
              <a href="tel:112">
                <Phone className="h-5 w-5" /> Call 112
              </a>
            </Button>
            <Button variant="destructive" size="lg" className="h-14 text-lg gap-2" asChild>
              <a href="tel:10177">
                <Phone className="h-5 w-5" /> Call 10177
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground font-bold text-lg">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-lg text-foreground">{step.title}</p>
                  <p className="text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
