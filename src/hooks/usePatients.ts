import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Patient, PatientStatus } from "@/types/patient";

// Simple hook to get all patients for selection dropdowns
export function usePatients() {
  return useQuery({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data as Patient[];
    },
  });
}

export type CourseStateFilter =
  | 'all'
  | 'has_active'
  | 'awaiting_scheduling'
  | 'completed'
  | 'no_course';

interface UsePatientListOptions {
  search?: string;
  status?: PatientStatus | 'all';
  treatment_type_id?: string | 'all';
  course_state?: CourseStateFilter;
  page?: number;
  pageSize?: number;
}

const ACTIVE_COURSE_STATUSES = ['draft', 'active', 'scheduled'] as const;

export interface PatientCourseSummary {
  id: string;
  status: string;
  sessions_completed: number | null;
  total_sessions_planned: number | null;
  appointment_type: { id: string; name: string; color: string } | null;
}

export interface PatientWithCourses extends Patient {
  treatment_courses: PatientCourseSummary[];
}

export function usePatientList(options: UsePatientListOptions = {}) {
  const {
    search = '',
    status = 'all',
    treatment_type_id = 'all',
    course_state = 'all',
    page = 1,
    pageSize = 10,
  } = options;

  return useQuery({
    queryKey: ['patients', { search, status, treatment_type_id, course_state, page, pageSize }],
    queryFn: async () => {
      // When filtering by treatment type or "has active course", we need an inner join
      // so Supabase performs the filter at the DB level.
      const needsInnerCourseJoin =
        treatment_type_id !== 'all' ||
        course_state === 'has_active' ||
        course_state === 'awaiting_scheduling' ||
        course_state === 'completed';

      const courseRel = needsInnerCourseJoin
        ? 'treatment_courses!inner(id, status, sessions_completed, total_sessions_planned, treatment_type_id, appointment_type:appointment_types(id, name, color))'
        : 'treatment_courses(id, status, sessions_completed, total_sessions_planned, treatment_type_id, appointment_type:appointment_types(id, name, color))';

      let query = supabase
        .from('patients')
        .select(`*, ${courseRel}`, { count: 'exact' });

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,id_number.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Course state → translates to filter on the joined treatment_courses rows
      if (course_state === 'has_active') {
        query = query.in('treatment_courses.status', ACTIVE_COURSE_STATUSES as unknown as string[]);
      } else if (course_state === 'awaiting_scheduling') {
        query = query.eq('treatment_courses.status', 'draft');
      } else if (course_state === 'completed') {
        query = query.eq('treatment_courses.status', 'completed');
      }

      if (treatment_type_id !== 'all') {
        query = query.eq('treatment_courses.treatment_type_id', treatment_type_id);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      let patients = (data as unknown as PatientWithCourses[]) ?? [];

      // "no_course" handled client-side (Supabase JS doesn't expose null-on-join cleanly)
      if (course_state === 'no_course') {
        patients = patients.filter((p) => !p.treatment_courses || p.treatment_courses.length === 0);
      }

      return {
        patients,
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
        currentPage: page,
      };
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Patient;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Patient> & { id: string }) => {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', data.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
