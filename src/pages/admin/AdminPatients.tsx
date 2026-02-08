import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientList } from "@/hooks/usePatients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import type { PatientStatus } from "@/types/patient";

export default function AdminPatients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<PatientStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const { data, isLoading, error } = usePatientList({
    search: debouncedSearch,
    status,
    page,
    pageSize: 10,
  });

  const getStatusBadgeVariant = (status: PatientStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground">
            Manage patient records and medical information
          </p>
        </div>
        <Button onClick={() => navigate('/admin/patients/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID number, phone, or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as PatientStatus | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden sm:table-cell">ID Number</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Medical Aid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-destructive">
                  Error loading patients. Please try again.
                </TableCell>
              </TableRow>
            ) : data?.patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {debouncedSearch
                        ? 'No patients found matching your search'
                        : 'No patients yet'}
                    </p>
                    {!debouncedSearch && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/patients/new')}
                      >
                        Add your first patient
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/patients/${patient.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {patient.first_name[0]}
                        {patient.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </div>
                        {patient.email && (
                          <div className="text-sm text-muted-foreground">
                            {patient.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {patient.id_number || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {patient.phone || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {patient.medical_aid_name || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(patient.status)}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(patient.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.totalCount)} of{' '}
            {data.totalCount} patients
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
