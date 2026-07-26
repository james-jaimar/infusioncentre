import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface DraftRow {
  id: string;
  data: Record<string, any>;
  updated_at?: string | null;
  created_at: string;
}

/**
 * Fetch the existing draft (if any) for a given patient + form template.
 */
export function useFormDraft(
  patientId: string | undefined,
  formTemplateId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["form_submission_draft", patientId, formTemplateId],
    queryFn: async (): Promise<DraftRow | null> => {
      if (!patientId || !formTemplateId) return null;
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id, data, created_at")
        .eq("patient_id", patientId)
        .eq("form_template_id", formTemplateId)
        .eq("status", "draft")
        .maybeSingle();
      if (error) throw error;
      return (data as any) ?? null;
    },
    enabled: !!patientId && !!formTemplateId && enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * List all draft template IDs for a patient — used to badge "In progress" items
 * in onboarding checklists.
 */
export function usePatientDraftTemplateIds(patientId: string | undefined) {
  return useQuery({
    queryKey: ["form_submission_drafts", patientId],
    queryFn: async () => {
      if (!patientId) return new Set<string>();
      const { data, error } = await supabase
        .from("form_submissions")
        .select("form_template_id")
        .eq("patient_id", patientId)
        .eq("status", "draft");
      if (error) throw error;
      return new Set((data || []).map((d: any) => d.form_template_id));
    },
    enabled: !!patientId,
  });
}

/**
 * useAutosaveDraft — wires debounced autosave for a form.
 *
 * - Loads any existing draft on mount (caller applies via onLoaded).
 * - Upserts the draft row on change (debounced).
 * - Flushes on unmount and on tab hide/close.
 * - Exposes `promote` to convert the draft into a submitted form.
 */
export function useAutosaveDraft(params: {
  patientId: string | undefined;
  formTemplateId: string | undefined;
  values: Record<string, any>;
  enabled: boolean;
  submittedBy?: string;
  /** Called once when the initial draft is fetched. */
  onDraftLoaded?: (draft: DraftRow | null) => void;
}) {
  const { patientId, formTemplateId, values, enabled, submittedBy, onDraftLoaded } = params;
  const qc = useQueryClient();
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const pendingRef = useRef<Record<string, any> | null>(null);
  const savingRef = useRef(false);
  const initialLoadRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Load initial draft.
  const draftKey = `${patientId}:${formTemplateId}`;
  useEffect(() => {
    if (!enabled || !patientId || !formTemplateId) return;
    if (initialLoadRef.current === draftKey) return;
    initialLoadRef.current = draftKey;
    (async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id, data, created_at")
        .eq("patient_id", patientId)
        .eq("form_template_id", formTemplateId)
        .eq("status", "draft")
        .maybeSingle();
      if (error) {
        console.warn("Failed to load draft:", error);
        onDraftLoaded?.(null);
        return;
      }
      if (data) {
        draftIdRef.current = data.id;
        setSavedAt(new Date(data.created_at));
        setStatus("saved");
      }
      onDraftLoaded?.((data as any) ?? null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, enabled]);

  const flush = useCallback(async () => {
    if (!enabled || !patientId || !formTemplateId) return;
    const toSave = pendingRef.current;
    if (!toSave || savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    try {
      if (draftIdRef.current) {
        const { error } = await supabase
          .from("form_submissions")
          .update({ data: toSave } as any)
          .eq("id", draftIdRef.current);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("form_submissions")
          .insert({
            patient_id: patientId,
            form_template_id: formTemplateId,
            data: toSave,
            status: "draft",
            submitted_by: submittedBy ?? null,
          } as any)
          .select("id")
          .single();
        if (error) {
          // Race: another tab created the draft first — fetch and switch to it.
          if ((error as any).code === "23505") {
            const { data: existing } = await supabase
              .from("form_submissions")
              .select("id")
              .eq("patient_id", patientId)
              .eq("form_template_id", formTemplateId)
              .eq("status", "draft")
              .single();
            if (existing) {
              draftIdRef.current = existing.id;
              const { error: updErr } = await supabase
                .from("form_submissions")
                .update({ data: toSave } as any)
                .eq("id", existing.id);
              if (updErr) throw updErr;
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        } else if (data) {
          draftIdRef.current = data.id;
        }
      }
      pendingRef.current = null;
      setSavedAt(new Date());
      setStatus("saved");
      qc.invalidateQueries({ queryKey: ["form_submission_drafts", patientId] });
    } catch (err) {
      console.warn("Autosave failed:", err);
      setStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [enabled, patientId, formTemplateId, submittedBy, qc]);

  // Debounced save on value changes.
  useEffect(() => {
    if (!enabled || !patientId || !formTemplateId) return;
    // Don't autosave an empty object before initial load resolves.
    if (initialLoadRef.current !== draftKey) return;
    // Skip save when nothing to persist yet.
    if (!values || Object.keys(values).length === 0) return;
    pendingRef.current = values;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      flush();
    }, 1500);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [values, enabled, patientId, formTemplateId, draftKey, flush]);

  // Flush on tab hide / before unload.
  useEffect(() => {
    if (!enabled) return;
    const onHide = () => { flush(); };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [enabled, flush]);

  // Flush on unmount.
  useEffect(() => {
    return () => { flush(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promote = useMutation({
    mutationFn: async (opts: {
      finalData: Record<string, any>;
      signature_data?: string | null;
      witness_signature_data?: string | null;
    }) => {
      if (!patientId || !formTemplateId) throw new Error("Missing patient or template");
      // Cancel any pending debounce
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      pendingRef.current = null;

      if (draftIdRef.current) {
        const { data, error } = await supabase
          .from("form_submissions")
          .update({
            data: opts.finalData,
            status: "submitted",
            signature_data: opts.signature_data ?? null,
            witness_signature_data: opts.witness_signature_data ?? null,
            submitted_by: submittedBy ?? null,
          } as any)
          .eq("id", draftIdRef.current)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("form_submissions")
          .insert({
            patient_id: patientId,
            form_template_id: formTemplateId,
            data: opts.finalData,
            status: "submitted",
            signature_data: opts.signature_data ?? null,
            witness_signature_data: opts.witness_signature_data ?? null,
            submitted_by: submittedBy ?? null,
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      draftIdRef.current = null;
      qc.invalidateQueries({ queryKey: ["form_submissions", patientId] });
      qc.invalidateQueries({ queryKey: ["form_submission_drafts", patientId] });
      qc.invalidateQueries({ queryKey: ["form_submission_draft", patientId, formTemplateId] });
      qc.invalidateQueries({ queryKey: ["onboarding_checklists"] });
      qc.invalidateQueries({ queryKey: ["form_submissions_readiness", patientId] });
    },
  });

  return { status, savedAt, flush, promote };
}