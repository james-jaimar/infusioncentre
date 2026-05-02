import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReferrals } from "@/hooks/useReferrals";
import { ReferralMetrics } from "@/components/admin/referrals/ReferralMetrics";
import { ReferralFilters } from "@/components/admin/referrals/ReferralFilters";
import { ReferralTable } from "@/components/admin/referrals/ReferralTable";
import { ReferralTriageDialog } from "@/components/admin/referrals/ReferralTriageDialog";
import { ConvertReferralDialog } from "@/components/admin/ConvertReferralDialog";
import { getReferralAttention, type ReferralAttention } from "@/lib/referralProgress";

export default function AdminReferrals() {
  const { data: referrals = [], isLoading } = useReferrals();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const initialAttention = (searchParams.get("attention") as ReferralAttention | "all" | "needs_attention" | null) || "all";

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [attentionFilter, setAttentionFilter] = useState<string>(initialAttention);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [convertReferral, setConvertReferral] = useState<any>(null);
  const [convertPatientId, setConvertPatientId] = useState<string | undefined>();
  const [triageOpen, setTriageOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const filtered = referrals.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (urgencyFilter !== "all" && r.urgency !== urgencyFilter) return false;
    if (doctorFilter !== "all" && r.doctor_id !== doctorFilter) return false;
    if (attentionFilter !== "all") {
      const a = getReferralAttention(r, r.course_count || 0);
      if (attentionFilter === "needs_attention") {
        if (a === "complete") return false;
      } else if (a !== attentionFilter) {
        return false;
      }
    }
    if (search) {
      const s = search.toLowerCase();
      const name = `${r.patient_first_name} ${r.patient_last_name}`.toLowerCase();
      if (!name.includes(s)) return false;
    }
    return true;
  });

  const openTriage = (referral: any) => {
    setSelectedReferral(referral);
    setTriageOpen(true);
  };

  const openConvertDirect = (referral: any) => {
    setConvertReferral(referral);
    setConvertPatientId(referral.patient_id || undefined);
    setConvertOpen(true);
  };

  const handleConvertToCourse = (referral: any, patientId: string) => {
    setConvertReferral(referral);
    setConvertPatientId(patientId);
    setConvertOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Referral Queue</h1>
        <p className="text-muted-foreground">Triage, review, and convert incoming referrals</p>
      </div>

      <ReferralMetrics referrals={referrals} />

      <ReferralFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        attentionFilter={attentionFilter}
        setAttentionFilter={setAttentionFilter}
        urgencyFilter={urgencyFilter}
        setUrgencyFilter={setUrgencyFilter}
        doctorFilter={doctorFilter}
        setDoctorFilter={setDoctorFilter}
        search={search}
        setSearch={setSearch}
      />

      <ReferralTable
        referrals={filtered}
        isLoading={isLoading}
        onReview={openTriage}
        onSetupCourse={openConvertDirect}
      />

      <ReferralTriageDialog
        key={selectedReferral?.id || "none"}
        referral={selectedReferral}
        open={triageOpen}
        onOpenChange={setTriageOpen}
        onConvertToCourse={handleConvertToCourse}
      />

      <ConvertReferralDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        referral={convertReferral}
        patientId={convertPatientId}
      />
    </div>
  );
}
