import { useState } from "react";
import { useReferrals } from "@/hooks/useReferrals";
import { ReferralMetrics } from "@/components/admin/referrals/ReferralMetrics";
import { ReferralFilters } from "@/components/admin/referrals/ReferralFilters";
import { ReferralTable } from "@/components/admin/referrals/ReferralTable";
import { ReferralTriageDialog } from "@/components/admin/referrals/ReferralTriageDialog";
import { ConvertReferralDialog } from "@/components/admin/ConvertReferralDialog";

export default function AdminReferrals() {
  const { data: referrals = [], isLoading } = useReferrals();

  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [triageOpen, setTriageOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const filtered = referrals.filter((r: any) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (urgencyFilter !== "all" && r.urgency !== urgencyFilter) return false;
    if (doctorFilter !== "all" && r.doctor_id !== doctorFilter) return false;
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

  const handleConvertToCourse = (referral: any, patientId: string) => {
    setSelectedReferral({ ...referral, patient_id: patientId });
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
      />

      <ReferralTriageDialog
        referral={selectedReferral}
        open={triageOpen}
        onOpenChange={setTriageOpen}
        onConvertToCourse={handleConvertToCourse}
      />

      <ConvertReferralDialog open={convertOpen} onOpenChange={setConvertOpen} />
    </div>
  );
}
