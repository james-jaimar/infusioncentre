import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PatientDocument, DocumentType } from "@/types/patient";

export function usePatientDocuments(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as PatientDocument[];
    },
    enabled: !!patientId,
  });
}

export function useUploadPatientDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      file,
      documentType,
      notes,
    }: {
      patientId: string;
      file: File;
      documentType: DocumentType;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          document_type: documentType,
          file_name: file.name,
          file_path: fileName,
          uploaded_by: user?.user?.id,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PatientDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', data.patient_id] });
    },
  });
}

export function useDeletePatientDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, patientId }: { id: string; filePath: string; patientId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return patientId;
    },
    onSuccess: (patientId) => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
    },
  });
}

export function useGetDocumentUrl() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    },
  });
}
