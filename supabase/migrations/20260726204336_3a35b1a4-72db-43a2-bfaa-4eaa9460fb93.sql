CREATE UNIQUE INDEX IF NOT EXISTS form_submissions_one_draft_per_patient_template
  ON public.form_submissions (patient_id, form_template_id)
  WHERE status = 'draft';