import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Patient, PatientStatus } from "@/types/patient";
import {
  derivePatientStage,
  ACTIVE_COURSE_STATUSES as PIPELINE_ACTIVE_STATUSES,
  type PatientStage,
} from "@/lib/patientPipeline";

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
  stage?: PatientStage | 'all';
  page?: number;
  pageSize?: number;
}

// Re-export so the page can stay aligned with the pipeline definition
export const ACTIVE_COURSE_STATUSES = PIPELINE_ACTIVE_STATUSES;

export interface PatientCourseSummary {
  id: string;
  status: string;
  sessions_completed: number | null;
  total_sessions_planned: number | null;
  appointment_type: { id: string; name: string; color: string } | null;
}

export interface PatientWithCourses extends Patient {
  treatment_courses: PatientCourseSummary[];
  pipeline_stage?: PatientStage;
  pending_invite_count?: number;
  checklist_total?: number;
  checklist_completed?: number;
  appointments_scheduled?: number;
  appointments_completed?: number;
}

export function usePatientList(options: UsePatientListOptions = {}) {
  const {
    search = '',
    status = 'all',
    treatment_type_id = 'all',
    course_state = 'all',
    stage = 'all',
    page = 1,
    pageSize = 10,
  } = options;

  return useQuery({
    queryKey: ['patients', { search, status, treatment_type_id, course_state, stage, page, pageSize }],
    queryFn: async () => {
      // When stage filter is active we need every row in scope so we can derive client-side.
      const stageFilterActive = stage && stage !== 'all';

      // Inner join only when DB-level course filter is requested
      const needsInnerCourseJoin =
        !stageFilterActive && (
          treatment_type_id !== 'all' ||
          course_state === 'has_active' ||
          course_state === 'awaiting_scheduling' ||
          course_state === 'completed'
        );

      const courseRel = needsInnerCourseJoin
        ? 'treatment_courses!inner(id, status, sessions_completed, total_sessions_planned, treatment_type_id, appointment_type:appointment_types(id, name, color))'
        : 'treatment_courses(id, status, sessions_completed, total_sessions_planned, treatment_type_id, appointment_type:appointment_types(id, name, color))';

      let query = supabase
        .from('patients')
        .select(
          `*, ${courseRel}, patient_invites(status, created_at, expires_at), onboarding_checklists(status), appointments(status, treatment_course_id)`,
          { count: 'exact' }
        );

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,id_number.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Course state → translates to filter on the joined treatment_courses rows
      // Skip when stage filter is active (we filter client-side)
      if (!stageFilterActive) {
        if (course_state === 'has_active') {
          query = query.in('treatment_courses.status', ACTIVE_COURSE_STATUSES as any);
        } else if (course_state === 'completed') {
          query = query.eq('treatment_courses.status', 'completed');
        }
        // 'awaiting_scheduling' is now handled client-side via derived stage below

        if (treatment_type_id !== 'all') {
          query = query.eq('treatment_courses.treatment_type_id', treatment_type_id);
        }
      }

      // When deriving stage, we need everything; skip server-side range
      const useServerPagination = !stageFilterActive && course_state !== 'awaiting_scheduling' && course_state !== 'no_course';
      if (useServerPagination) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      } else {
        query = query.limit(500); // safety cap for client-side filter
      }
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      let patients = (data as unknown as PatientWithCourses[]) ?? [];

      // Annotate every row with derived stage and helper counts
      patients = patients.map((p) => {
        const checklists = (p as any).onboarding_checklists ?? [];
        const checklistTotal = checklists.length;
        const checklistCompleted = checklists.filter((c: any) => c.status === 'completed').length;
        const allAppts = (p as any).appointments ?? [];
        const activeCourseId = (p.treatment_courses ?? []).find((c: any) =>
          (ACTIVE_COURSE_STATUSES as readonly string[]).includes(c.status)
        )?.id;
        // Scope appointment counts to the active course so prior course history doesn't leak in.
        const appts = activeCourseId
          ? allAppts.filter((a: any) => a.treatment_course_id === activeCourseId)
          : allAppts;
        const appointmentsScheduled = appts.filter((a: any) => a.status !== 'cancelled' && a.status !== 'completed').length;
        const appointmentsCompleted = appts.filter((a: any) => a.status === 'completed').length;
        const invites = (p as any).patient_invites ?? [];
        const pendingInviteCount = invites.filter((i: any) => i.status === 'pending' && new Date(i.expires_at) > new Date()).length;
        const pipeline_stage = derivePatientStage({
          patient: p,
          courses: p.treatment_courses ?? [],
          invites,
          checklistTotal,
          checklistCompleted,
          appointmentsScheduled,
          appointmentsCompleted,
        });
        return {
          ...p,
          pipeline_stage,
          pending_invite_count: pendingInviteCount,
          checklist_total: checklistTotal,
          checklist_completed: checklistCompleted,
          appointments_scheduled: appointmentsScheduled,
          appointments_completed: appointmentsCompleted,
        };
      });

      // Client-side filters
      if (course_state === 'no_course') {
        patients = patients.filter((p) => !p.treatment_courses || p.treatment_courses.length === 0);
      }
      if (course_state === 'awaiting_scheduling') {
        patients = patients.filter((p) => p.pipeline_stage === 'ready_to_schedule' || p.pipeline_stage === 'onboarding' || p.pipeline_stage === 'needs_invite' || p.pipeline_stage === 'invite_sent');
      }
      if (stageFilterActive) {
        patients = patients.filter((p) => p.pipeline_stage === stage);
      }

      let totalCount = count ?? 0;
      let totalPages = Math.ceil(totalCount / pageSize);
      if (!useServerPagination) {
        totalCount = patients.length;
        totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const from = (page - 1) * pageSize;
        patients = patients.slice(from, from + pageSize);
      }

      return {
        patients,
        totalCount,
        totalPages,
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
