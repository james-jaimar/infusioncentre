import { useState, useEffect } from "react";
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
import { useIVAccess, useAddIVAccess, useUpdateIVAccess, useSiteChecks, useAddSiteCheck } from "@/hooks/useIVAccess";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import { Plus, Syringe, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { SITE_APPEARANCE_OPTIONS, type IVAccessType } from "@/types/treatment";

interface JobCardIVAccessProps {
  treatmentId: string;
  isCompleted?: boolean;
}

export default function JobCardIVAccess({ treatmentId, isCompleted }: JobCardIVAccessProps) {
  const { user } = useAuth();
  const { data: accesses } = useIVAccess(treatmentId);
  const addAccess = useAddIVAccess();
  const updateAccess = useUpdateIVAccess();
  const activeAccess = accesses?.find((a) => !a.removed_at);
  const { data: siteChecks } = useSiteChecks(activeAccess?.id);
  const addSiteCheck = useAddSiteCheck();

  const [openAccess, setOpenAccess] = useState(false);
  const [openCheck, setOpenCheck] = useState(false);
  const [accessForm, setAccessForm] = useState({
    access_type: "peripheral" as IVAccessType,
    gauge: "",
    site_location: "",
    insertion_attempts: "1",
    dressing_type: "",
    flush_solution: "10ml NS",
    notes: "",
  });
  const [checkForm, setCheckForm] = useState({
    site_appearance: [] as string[],
    phlebitis_grade: null as number | null,
    infiltration_grade: null as number | null,
    action_taken: "",
    notes: "",
  });

  // Site check timer
  const [minutesSinceCheck, setMinutesSinceCheck] = useState<number | null>(null);
  useEffect(() => {
    if (!activeAccess) { setMinutesSinceCheck(null); return; }
    const lastCheck = siteChecks?.length ? siteChecks[siteChecks.length - 1].checked_at : activeAccess.inserted_at;
    const calc = () => setMinutesSinceCheck(differenceInMinutes(new Date(), new Date(lastCheck)));
    calc();
    const interval = setInterval(calc, 30000);
    return () => clearInterval(interval);
  }, [activeAccess, siteChecks]);

  const handleAddAccess = async () => {
    if (!user?.id) return;
    try {
      await addAccess.mutateAsync({
        treatment_id: treatmentId,
        access_type: accessForm.access_type,
        gauge: accessForm.gauge || null,
        site_location: accessForm.site_location || null,
        insertion_attempts: Number(accessForm.insertion_attempts) || 1,
        inserted_at: new Date().toISOString(),
        inserted_by: user.id,
        dressing_type: accessForm.dressing_type || null,
        flush_solution: accessForm.flush_solution || null,
        removed_at: null,
        removal_site_condition: null,
        notes: accessForm.notes || null,
      });
      setOpenAccess(false);
      toast({ title: "IV access documented" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveAccess = async () => {
    if (!activeAccess) return;
    try {
      await updateAccess.mutateAsync({
        id: activeAccess.id,
        data: { removed_at: new Date().toISOString(), removal_site_condition: "Site intact, no complications" },
      });
      toast({ title: "IV access removed and documented" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSiteCheck = async () => {
    if (!user?.id || !activeAccess) return;
    try {
      await addSiteCheck.mutateAsync({
        treatment_id: treatmentId,
        iv_access_id: activeAccess.id,
        checked_at: new Date().toISOString(),
        checked_by: user.id,
        site_appearance: checkForm.site_appearance,
        phlebitis_grade: checkForm.phlebitis_grade,
        infiltration_grade: checkForm.infiltration_grade,
        action_taken: checkForm.action_taken || null,
        notes: checkForm.notes || null,
      });
      setOpenCheck(false);
      setCheckForm({ site_appearance: [], phlebitis_grade: null, infiltration_grade: null, action_taken: "", notes: "" });
      toast({ title: "Site check recorded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const timerColor = minutesSinceCheck === null ? "" : minutesSinceCheck >= 60 ? "text-destructive" : minutesSinceCheck >= 45 ? "text-amber-600" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">IV Access</CardTitle>
          {activeAccess && minutesSinceCheck !== null && (
            <Badge variant="outline" className={`gap-1 ${timerColor}`}>
              <Clock className="h-3 w-3" />
              {minutesSinceCheck}m since check
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {activeAccess && !isCompleted && (
            <Dialog open={openCheck} onOpenChange={setOpenCheck}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 h-11 min-w-[44px]">
                  <CheckCircle2 className="h-4 w-4" /> Site Check
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>IV Site Check</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Site Appearance</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {SITE_APPEARANCE_OPTIONS.map((opt) => (
                        <div key={opt} className="flex items-center gap-2">
                          <Checkbox
                            id={`site-${opt}`}
                            checked={checkForm.site_appearance.includes(opt)}
                            onCheckedChange={(checked) => {
                              setCheckForm((f) => ({
                                ...f,
                                site_appearance: checked
                                  ? [...f.site_appearance, opt]
                                  : f.site_appearance.filter((s) => s !== opt),
                              }));
                            }}
                            className="h-6 w-6"
                          />
                          <Label htmlFor={`site-${opt}`} className="text-sm capitalize cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phlebitis Grade (VIP 0-4)</Label>
                      <Select value={checkForm.phlebitis_grade?.toString() ?? "none"} onValueChange={(v) => setCheckForm((f) => ({ ...f, phlebitis_grade: v === "none" ? null : Number(v) }))}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="N/A" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">N/A</SelectItem>
                          <SelectItem value="0">0 – No signs</SelectItem>
                          <SelectItem value="1">1 – Slight pain/redness</SelectItem>
                          <SelectItem value="2">2 – Pain + redness/swelling</SelectItem>
                          <SelectItem value="3">3 – Pain + streak + palpable cord</SelectItem>
                          <SelectItem value="4">4 – Advanced (purulent)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Infiltration Grade (0-4)</Label>
                      <Select value={checkForm.infiltration_grade?.toString() ?? "none"} onValueChange={(v) => setCheckForm((f) => ({ ...f, infiltration_grade: v === "none" ? null : Number(v) }))}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="N/A" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">N/A</SelectItem>
                          <SelectItem value="0">0 – No signs</SelectItem>
                          <SelectItem value="1">1 – &lt;1 inch swelling</SelectItem>
                          <SelectItem value="2">2 – 1-6 inch swelling</SelectItem>
                          <SelectItem value="3">3 – &gt;6 inch swelling</SelectItem>
                          <SelectItem value="4">4 – Skin blanched, tight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Action Taken</Label>
                    <Input value={checkForm.action_taken} onChange={(e) => setCheckForm((f) => ({ ...f, action_taken: e.target.value }))} placeholder="e.g., None, dressing changed, site changed" />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={checkForm.notes} onChange={(e) => setCheckForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleSiteCheck} className="w-full h-12 mt-2" disabled={addSiteCheck.isPending}>Record Site Check</Button>
              </DialogContent>
            </Dialog>
          )}
          {!activeAccess && !isCompleted && (
            <Dialog open={openAccess} onOpenChange={setOpenAccess}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 h-11 min-w-[44px]"><Plus className="h-4 w-4" /> Add IV Access</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Document IV Access</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Access Type</Label>
                    <Select value={accessForm.access_type} onValueChange={(v) => setAccessForm((f) => ({ ...f, access_type: v as IVAccessType }))}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="peripheral">Peripheral</SelectItem>
                        <SelectItem value="midline">Midline</SelectItem>
                        <SelectItem value="picc">PICC</SelectItem>
                        <SelectItem value="port">Port</SelectItem>
                        <SelectItem value="central">Central</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gauge</Label>
                      <Select value={accessForm.gauge || "none"} onValueChange={(v) => setAccessForm((f) => ({ ...f, gauge: v === "none" ? "" : v }))}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select</SelectItem>
                          <SelectItem value="24G">24G (Yellow)</SelectItem>
                          <SelectItem value="22G">22G (Blue)</SelectItem>
                          <SelectItem value="20G">20G (Pink)</SelectItem>
                          <SelectItem value="18G">18G (Green)</SelectItem>
                          <SelectItem value="16G">16G (Grey)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Insertion Attempts</Label>
                      <Input type="number" className="h-12 text-lg" value={accessForm.insertion_attempts}
                        onChange={(e) => setAccessForm((f) => ({ ...f, insertion_attempts: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Site Location</Label>
                    <Input className="h-12" value={accessForm.site_location}
                      onChange={(e) => setAccessForm((f) => ({ ...f, site_location: e.target.value }))}
                      placeholder="e.g., Right dorsal hand, cephalic vein" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Dressing Type</Label>
                      <Input value={accessForm.dressing_type}
                        onChange={(e) => setAccessForm((f) => ({ ...f, dressing_type: e.target.value }))}
                        placeholder="e.g., Tegaderm" />
                    </div>
                    <div>
                      <Label>Flush Solution</Label>
                      <Input value={accessForm.flush_solution}
                        onChange={(e) => setAccessForm((f) => ({ ...f, flush_solution: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={accessForm.notes} onChange={(e) => setAccessForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleAddAccess} className="w-full h-12 mt-2" disabled={addAccess.isPending}>Document IV Access</Button>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeAccess ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-semibold text-sm capitalize">{activeAccess.access_type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gauge</p>
                <p className="font-semibold text-sm">{activeAccess.gauge || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Site</p>
                <p className="font-semibold text-sm">{activeAccess.site_location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inserted</p>
                <p className="font-semibold text-sm">{format(new Date(activeAccess.inserted_at), "HH:mm")}</p>
              </div>
            </div>

            {/* Site check history */}
            {siteChecks && siteChecks.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Site Checks ({siteChecks.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {siteChecks.map((c) => (
                    <div key={c.id} className="text-xs flex items-center gap-3 text-muted-foreground">
                      <span className="font-mono">{format(new Date(c.checked_at), "HH:mm")}</span>
                      <span>{c.site_appearance.join(", ") || "normal"}</span>
                      {c.phlebitis_grade !== null && c.phlebitis_grade > 0 && (
                        <Badge variant="destructive" className="text-xs h-5">VIP {c.phlebitis_grade}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isCompleted && (
              <Button variant="outline" size="sm" onClick={handleRemoveAccess} className="h-11 min-w-[44px]">
                Remove IV Access
              </Button>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3 text-sm">
            {accesses?.some((a) => a.removed_at) ? "IV access removed." : "No IV access documented yet."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
