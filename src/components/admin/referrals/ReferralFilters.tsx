import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useStatusDictionaries } from "@/hooks/useStatusDictionaries";
import { useAllDoctors } from "@/hooks/useDoctors";

interface Props {
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  urgencyFilter: string;
  setUrgencyFilter: (v: string) => void;
  doctorFilter: string;
  setDoctorFilter: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
}

export function ReferralFilters({
  statusFilter,
  setStatusFilter,
  urgencyFilter,
  setUrgencyFilter,
  doctorFilter,
  setDoctorFilter,
  search,
  setSearch,
}: Props) {
  const { data: statuses = [] } = useStatusDictionaries("referral");
  const { data: doctors = [] } = useAllDoctors();

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search patient name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-52"
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s.status_key} value={s.status_key}>
              {s.display_label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Urgency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Urgency</SelectItem>
          <SelectItem value="routine">Routine</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
      <Select value={doctorFilter} onValueChange={setDoctorFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Doctor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Doctors</SelectItem>
          {doctors.map((d: any) => (
            <SelectItem key={d.id} value={d.id}>
              {d.practice_name || d.email || d.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
