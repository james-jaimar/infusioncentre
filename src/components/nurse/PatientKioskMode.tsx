import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldAlert } from "lucide-react";
import FullScreenFormDialog from "@/components/forms/FullScreenFormDialog";
import type { FormField } from "@/components/forms/FormRenderer";
import type { OverlayField } from "@/components/forms/PdfOverlayRenderer";

const PIN_KEY = "nurseKioskPin";

interface PatientKioskModeProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  patientName: string;
  formTitle: string;
  formDescription?: string;
  schema: FormField[];
  values: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
  renderMode?: "schema" | "pdf_overlay" | "facsimile";
  pdfPages?: string[];
  overlayFields?: OverlayField[];
  slug?: string;
}

/**
 * Patient Kiosk Mode — wraps a form in a tablet-handoff experience.
 * The nurse sets a PIN before handing the tablet to the patient. The patient
 * cannot exit until they submit the form OR the nurse re-enters the PIN.
 */
export default function PatientKioskMode(props: PatientKioskModeProps) {
  const { open, onClose, patientName, formTitle, formDescription } = props;
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  // On open, ensure a PIN exists (set up if not).
  useEffect(() => {
    if (!open) return;
    const existing = sessionStorage.getItem(PIN_KEY);
    if (!existing) {
      setPinSetupOpen(true);
    }
  }, [open]);

  const handleSavePin = () => {
    setPinError(null);
    if (!/^\d{4}$/.test(newPin)) {
      setPinError("PIN must be 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match.");
      return;
    }
    sessionStorage.setItem(PIN_KEY, newPin);
    setNewPin("");
    setConfirmPin("");
    setPinSetupOpen(false);
  };

  const handleAttemptExit = () => {
    setPinError(null);
    setEnteredPin("");
    setPinPromptOpen(true);
  };

  const handleVerifyPin = () => {
    const stored = sessionStorage.getItem(PIN_KEY);
    if (enteredPin === stored) {
      setPinPromptOpen(false);
      setEnteredPin("");
      onClose();
    } else {
      setPinError("Incorrect PIN.");
    }
  };

  // While PIN setup dialog is shown, render only that — don't expose the form yet.
  if (open && pinSetupOpen) {
    return (
      <Dialog open onOpenChange={() => { /* trap until set */ }}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Set a kiosk PIN
            </DialogTitle>
            <DialogDescription>
              Choose a 4-digit PIN. You'll enter it to unlock the tablet after the patient finishes — or to exit early.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="kiosk-new-pin">New PIN</Label>
              <Input
                id="kiosk-new-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-lg tracking-widest text-center"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="kiosk-confirm-pin">Confirm PIN</Label>
              <Input
                id="kiosk-confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-lg tracking-widest text-center"
              />
            </div>
            {pinError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> {pinError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSavePin}>Lock & Hand Over</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <FullScreenFormDialog
        open={open}
        onClose={handleAttemptExit}
        title={`Hi ${patientName.split(" ")[0]}, please complete: ${formTitle}`}
        description={formDescription}
        schema={props.schema}
        values={props.values}
        onChange={props.onChange}
        onSubmit={props.onSubmit}
        isSubmitting={props.isSubmitting}
        submitLabel="Submit & Return"
        renderMode={props.renderMode}
        pdfPages={props.pdfPages}
        overlayFields={props.overlayFields}
        slug={props.slug}
      />

      <Dialog open={pinPromptOpen} onOpenChange={setPinPromptOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Enter nurse PIN
            </DialogTitle>
            <DialogDescription>
              Please ask a nurse to unlock the tablet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={enteredPin}
              onChange={(e) => { setEnteredPin(e.target.value.replace(/\D/g, "")); setPinError(null); }}
              className="h-12 text-lg tracking-widest text-center"
              autoFocus
            />
            {pinError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> {pinError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinPromptOpen(false)}>Back to form</Button>
            <Button onClick={handleVerifyPin}>Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
