-- Create the messages table for in-app chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id),
  conversation_type text NOT NULL CHECK (conversation_type IN ('admin_patient', 'admin_doctor')),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Admin: full access within tenant
CREATE POLICY "Admins can manage messages"
ON public.messages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

-- Doctors: read/write their own conversations
CREATE POLICY "Doctors can view own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND conversation_type = 'admin_doctor'
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = messages.doctor_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND conversation_type = 'admin_doctor'
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = messages.doctor_id AND d.user_id = auth.uid()
  )
);

-- Patients: read/write their own conversations
CREATE POLICY "Patients can view own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND conversation_type = 'admin_patient'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = messages.patient_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND conversation_type = 'admin_patient'
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = messages.patient_id AND p.user_id = auth.uid()
  )
);

-- Doctors can mark messages as read
CREATE POLICY "Doctors can update read status"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND conversation_type = 'admin_doctor'
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = messages.doctor_id AND d.user_id = auth.uid()
  )
);

-- Patients can mark messages as read
CREATE POLICY "Patients can update read status"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND conversation_type = 'admin_patient'
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = messages.patient_id AND p.user_id = auth.uid()
  )
);

-- Index for fast conversation lookups
CREATE INDEX idx_messages_patient ON public.messages(patient_id, created_at DESC) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_messages_doctor ON public.messages(doctor_id, created_at DESC) WHERE doctor_id IS NOT NULL;
CREATE INDEX idx_messages_unread ON public.messages(is_read, tenant_id) WHERE is_read = false;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;