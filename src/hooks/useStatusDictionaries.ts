import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EntityType = "referral" | "treatment_course" | "appointment" | "treatment";

export interface StatusDictionary {
  id: string;
  entity_type: string;
  status_key: string;
  display_label: string;
  description: string | null;
  color: string;
  display_order: number;
  is_default: boolean;
  is_terminal: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatusTransition {
  id: string;
  entity_type: string;
  from_status: string;
  to_status: string;
  required_role: string | null;
  label: string | null;
  auto_trigger: string | null;
  created_at: string;
}

const DICT_KEY = "status-dictionaries";
const TRANS_KEY = "status-transitions";

export function useStatusDictionaries(entityType?: EntityType) {
  return useQuery({
    queryKey: [DICT_KEY, entityType],
    queryFn: async () => {
      let query = supabase
        .from("status_dictionaries" as any)
        .select("*")
        .order("entity_type")
        .order("display_order");

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as StatusDictionary[];
    },
  });
}

export function useStatusTransitions(entityType?: EntityType) {
  return useQuery({
    queryKey: [TRANS_KEY, entityType],
    queryFn: async () => {
      let query = supabase
        .from("status_transitions" as any)
        .select("*")
        .order("entity_type")
        .order("from_status");

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as StatusTransition[];
    },
  });
}

/** Returns allowed next statuses for a given entity type and current status */
export function useAllowedTransitions(entityType: EntityType, currentStatus: string) {
  const { data: transitions = [] } = useStatusTransitions(entityType);
  const { data: dictionaries = [] } = useStatusDictionaries(entityType);

  const allowed = transitions
    .filter((t) => t.from_status === currentStatus)
    .map((t) => {
      const dict = dictionaries.find((d) => d.status_key === t.to_status);
      return {
        ...t,
        display_label: dict?.display_label ?? t.to_status,
        color: dict?.color ?? "#6b7280",
      };
    });

  return allowed;
}

/** Get display info for a status */
export function useStatusDisplay(entityType: EntityType) {
  const { data: dictionaries = [] } = useStatusDictionaries(entityType);

  return (statusKey: string) => {
    const dict = dictionaries.find((d) => d.status_key === statusKey);
    return {
      label: dict?.display_label ?? statusKey,
      color: dict?.color ?? "#6b7280",
      isTerminal: dict?.is_terminal ?? false,
    };
  };
}

export function useUpdateStatusDictionary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StatusDictionary> }) => {
      const { error } = await supabase
        .from("status_dictionaries" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [DICT_KEY] }),
  });
}

export function useCreateStatusDictionary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StatusDictionary, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("status_dictionaries" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [DICT_KEY] }),
  });
}
