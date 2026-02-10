
-- Phase 2: Dynamic Onboarding Form System

-- Enums
CREATE TYPE public.form_category AS ENUM ('consent', 'medical_questionnaire', 'administrative', 'monitoring');
CREATE TYPE public.form_submission_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved');
CREATE TYPE public.checklist_item_status AS ENUM ('pending', 'in_progress', 'completed', 'waived');

-- Form Templates table
CREATE TABLE public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category public.form_category NOT NULL,
  form_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  required_for_treatment_types uuid[] DEFAULT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage form templates" ON public.form_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view form templates" ON public.form_templates FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Patients can view active form templates" ON public.form_templates FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON public.form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Form Submissions table
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  submitted_by uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.form_submission_status NOT NULL DEFAULT 'draft',
  signature_data text,
  witness_signature_data text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage form submissions" ON public.form_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view form submissions" ON public.form_submissions FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can insert form submissions" ON public.form_submissions FOR INSERT WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can update form submissions" ON public.form_submissions FOR UPDATE USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Patients can view own submissions" ON public.form_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = form_submissions.patient_id AND patients.user_id = auth.uid()));
CREATE POLICY "Patients can insert own submissions" ON public.form_submissions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM patients WHERE patients.id = form_submissions.patient_id AND patients.user_id = auth.uid()));
CREATE POLICY "Patients can update own draft submissions" ON public.form_submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = form_submissions.patient_id AND patients.user_id = auth.uid()) AND status IN ('draft', 'submitted'));

-- Onboarding Checklists table
CREATE TABLE public.onboarding_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id),
  form_submission_id uuid REFERENCES public.form_submissions(id),
  status public.checklist_item_status NOT NULL DEFAULT 'pending',
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage onboarding checklists" ON public.onboarding_checklists FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view onboarding checklists" ON public.onboarding_checklists FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can update onboarding checklists" ON public.onboarding_checklists FOR UPDATE USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Patients can view own checklists" ON public.onboarding_checklists FOR SELECT USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = onboarding_checklists.patient_id AND patients.user_id = auth.uid()));

-- Pre-seed form templates

-- 1. Patient Information & Agreement for Care
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'Patient Information & Agreement for Care',
  'Main patient intake form with personal details, medical aid info, terms and consent.',
  'administrative',
  '[
    {"field_name":"section_patient","field_type":"section_header","label":"Patient Details"},
    {"field_name":"patient_name","field_type":"text","label":"Name & Surname","required":true,"placeholder":"Mr./Mrs./Ms./Miss./Child"},
    {"field_name":"id_number","field_type":"text","label":"ID Number","required":true},
    {"field_name":"age","field_type":"number","label":"Age","required":true},
    {"field_name":"email","field_type":"text","label":"Email","required":true},
    {"field_name":"mobile","field_type":"text","label":"Mobile No.","required":true},
    {"field_name":"street_address","field_type":"textarea","label":"Street Address","required":true},
    {"field_name":"next_of_kin_name","field_type":"text","label":"Next of Kin Name"},
    {"field_name":"next_of_kin_contact","field_type":"text","label":"Next of Kin Contact No."},
    {"field_name":"section_rep","field_type":"section_header","label":"Patient Representative Details (if required)"},
    {"field_name":"rep_name","field_type":"text","label":"Representative Name"},
    {"field_name":"rep_relationship","field_type":"text","label":"Relationship to Patient"},
    {"field_name":"rep_email","field_type":"text","label":"Representative Email"},
    {"field_name":"rep_mobile","field_type":"text","label":"Representative Mobile No."},
    {"field_name":"section_medical_aid","field_type":"section_header","label":"Medical Aid Information"},
    {"field_name":"main_member","field_type":"text","label":"Main Member (Mr./Mrs./Miss)"},
    {"field_name":"main_member_id","field_type":"text","label":"Main Member ID"},
    {"field_name":"medical_aid_name","field_type":"text","label":"Medical Aid Name"},
    {"field_name":"medical_aid_number","field_type":"text","label":"Medical Aid No."},
    {"field_name":"auth_number","field_type":"text","label":"Authorisation No. (if applicable)"},
    {"field_name":"icd10_code","field_type":"text","label":"ICD 10 Code"},
    {"field_name":"section_terms","field_type":"section_header","label":"Terms and Agreement of Service"},
    {"field_name":"terms_info","field_type":"info_text","label":"","content":"Agreement for the provision of nursing care between The Johannesburg Infusion Centre and Patient or Patient representative.\n\nThe Johannesburg Infusion Centre (Pty) Ltd - Reg No: 2021/444310/07"},
    {"field_name":"agreement_date","field_type":"date","label":"Agreement Date","required":true},
    {"field_name":"rep_responsibility_info","field_type":"info_text","label":"","content":"The Patient Representative consents to the treatment as prescribed and accepts responsibility for payment of all accounts."},
    {"field_name":"cancellation_info","field_type":"info_text","label":"","content":"Cancellation Policy: All appointments must be cancelled at least 24 hours before the scheduled time. Less than 24 hours notice incurs a R700 fee. Non-attendance without cancellation incurs a R1000 fee.\n\nThis is a limited hours facility. For any emergencies or complications, parties should seek help from the nearest 24-hour casualty or treating doctor."},
    {"field_name":"patient_signature","field_type":"signature","label":"Patient Signature","required":true},
    {"field_name":"patient_id_confirm","field_type":"text","label":"ID Number (confirmation)","required":true},
    {"field_name":"rep_signature","field_type":"signature","label":"Representative Signature"},
    {"field_name":"rep_id_confirm","field_type":"text","label":"Representative ID Number"}
  ]'::jsonb,
  1
);

-- 2. POPI Consent
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'POPI Consent',
  'Consent for collection and processing of patient information (POPIA compliance).',
  'consent',
  '[
    {"field_name":"popi_intro","field_type":"info_text","label":"","content":"Confidentiality of patients'' personal information is of the utmost importance to the practice of The Johannesburg Infusion Centre (Pty) Ltd. This consent form serves to summarise what personal information is collected by the practice, how this information is used, and how we as a practice store and protect this information.\n\nI confirm that I provide consent of my own free will without any undue influence from any person whatsoever. I have received all the information required to provide consent."},
    {"field_name":"section_consent","field_type":"section_header","label":"I consent to the following specific processing activities:"},
    {"field_name":"consent_medical_scheme","field_type":"checkbox","label":"The submission of my accounts to my medical scheme / other funder"},
    {"field_name":"consent_diagnosis_info","field_type":"checkbox","label":"The submission of information relevant to my diagnosis and treatment to my medical scheme / other funder, if required"},
    {"field_name":"consent_referral_letters","field_type":"checkbox","label":"The inclusion of relevant health information in referral letters and when providing reports about my treatment to referring practitioners"},
    {"field_name":"consent_peer_review","field_type":"checkbox","label":"Sharing of relevant information with bodies performing peer review of practitioners or clinical practice audits, subject to confidentiality undertakings"},
    {"field_name":"consent_payment","field_type":"checkbox","label":"The practice may submit my accounts to my medical scheme / other funder and any person responsible for payment of the accounts on my behalf"},
    {"field_name":"consent_marketing","field_type":"checkbox","label":"My personal information may be used by the practice to bring new products and services to my attention (I may opt out at any time)"},
    {"field_name":"concerns_info","field_type":"info_text","label":"","content":"Should you have any concern about the processing of your personal information, please raise this with any of the treating practitioners or the Information Officer. A complaint may also be lodged with the Information Regulator (+27 (0) 10 023 5207 / +27 (0) 82 746 4173 or complaints.IR@justice.gov.za)."},
    {"field_name":"full_name","field_type":"text","label":"Full Name(s) of Patient/Guardian","required":true},
    {"field_name":"id_number","field_type":"text","label":"ID Number","required":true},
    {"field_name":"popi_signature","field_type":"signature","label":"Signature","required":true},
    {"field_name":"popi_date","field_type":"date","label":"Date","required":true}
  ]'::jsonb,
  2
);

-- 3. Ketamine Consent (General)
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'Ketamine Infusion Consent',
  'Information and consent document for ketamine infusion treatment.',
  'consent',
  '[
    {"field_name":"section_info1","field_type":"section_header","label":"Ketamine as a Treatment for Depression"},
    {"field_name":"info_depression","field_type":"info_text","label":"","content":"Ketamine is a medication that has been used for more than 40 years as an anesthetic agent. More recently there has been interest in sub-anesthetic dosage for treatment of depression. Research is classified as level 1, with placebo-controlled studies confirming efficacy in acute treatment of depression.\n\nThe dose is 0.5 mg/kg body weight (not an anesthetic dose). If there is a good response after the initial 4 treatments given over 2 weeks, the usual maintenance frequency is every 2-4 weeks."},
    {"field_name":"info_experience","field_type":"info_text","label":"","content":"The Ketamine Infusion Experience:\n\nThe infusion runs over 40 minutes. You will be connected to a monitor measuring blood pressure, oxygen saturation, and heart rate. We discourage a large meal within four hours of the infusion.\n\nDuring the infusion you may experience dissociative effects - feeling disconnected, dreamlike state, or perceptual changes. These typically resolve within 30-60 minutes after the infusion ends."},
    {"field_name":"info_side_effects","field_type":"info_text","label":"","content":"Possible Side Effects:\n- Nausea (anti-nausea medication available)\n- Dizziness or lightheadedness\n- Drowsiness\n- Increased blood pressure or heart rate\n- Blurred or double vision\n- Feeling strange or unreal\n\nSevere reactions are rare. You MUST NOT drive or operate heavy machinery for the remainder of the day after an infusion."},
    {"field_name":"info_driving","field_type":"info_text","label":"","content":"Motor Vehicle Operation Post-Ketamine Infusion:\n\nPatients MUST be collected by a responsible adult. You may NOT drive yourself home. By undergoing the ketamine infusion, the patient agrees to indemnify and hold The Johannesburg Infusion Centre harmless from any claims arising from the patient''s decision to drive post-treatment."},
    {"field_name":"section_consent","field_type":"section_header","label":"Patient Consent"},
    {"field_name":"consent_understood","field_type":"checkbox","label":"I have read and understood the information about ketamine infusion therapy","required":true},
    {"field_name":"consent_side_effects","field_type":"checkbox","label":"I understand the possible side effects and risks","required":true},
    {"field_name":"consent_no_driving","field_type":"checkbox","label":"I understand I must NOT drive or operate machinery after the infusion","required":true},
    {"field_name":"consent_arranged_transport","field_type":"checkbox","label":"I have arranged for a responsible adult to collect me after the infusion","required":true},
    {"field_name":"consent_treatment","field_type":"checkbox","label":"I consent to receive ketamine infusion therapy as prescribed by my psychiatrist","required":true},
    {"field_name":"patient_name","field_type":"text","label":"Patient Name","required":true},
    {"field_name":"patient_signature","field_type":"signature","label":"Patient Signature","required":true},
    {"field_name":"consent_date","field_type":"date","label":"Date","required":true},
    {"field_name":"witness_name","field_type":"text","label":"Witness Name"},
    {"field_name":"witness_signature","field_type":"signature","label":"Witness Signature"}
  ]'::jsonb,
  3
);

-- 4. Ketamine Pre-Infusion Questionnaire
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'Ketamine Pre-Infusion Questionnaire',
  'Comprehensive patient history questionnaire for ketamine infusion patients.',
  'medical_questionnaire',
  '[
    {"field_name":"section_patient","field_type":"section_header","label":"Confidential Patient History"},
    {"field_name":"date_completed","field_type":"date","label":"Date","required":true},
    {"field_name":"full_name","field_type":"text","label":"Name in Full","required":true},
    {"field_name":"age","field_type":"number","label":"Age","required":true},
    {"field_name":"sex","field_type":"select","label":"Sex","required":true,"options":["Female","Male"]},
    {"field_name":"date_of_birth","field_type":"date","label":"Date of Birth","required":true},
    {"field_name":"id_number","field_type":"text","label":"ID Number","required":true},
    {"field_name":"guardian_name","field_type":"text","label":"Parent or Guardian Name (if under age)"},
    {"field_name":"guardian_relationship","field_type":"text","label":"Relationship"},
    {"field_name":"legal_guardian","field_type":"text","label":"Legal Guardian (if applicable)"},
    {"field_name":"how_heard","field_type":"text","label":"How did you hear about this clinic?"},
    {"field_name":"symptoms","field_type":"textarea","label":"Briefly describe your symptoms","required":true},
    {"field_name":"other_practitioners","field_type":"textarea","label":"List the names of other practitioners you have seen for these symptoms"},
    {"field_name":"hospitalisations","field_type":"textarea","label":"Psychiatric hospitalisations - include where, when and reasons"},
    {"field_name":"had_ect","field_type":"radio","label":"Have you ever had ECT?","options":["Yes","No"],"required":true},
    {"field_name":"had_psychotherapy","field_type":"radio","label":"Have you had psychotherapy?","options":["Yes","No"],"required":true},
    {"field_name":"treatment_goals","field_type":"textarea","label":"What are your treatment goals?","required":true},
    {"field_name":"struggle_1","field_type":"text","label":"Thing you struggle with #1 (hope to improve after therapy)"},
    {"field_name":"struggle_2","field_type":"text","label":"Thing you struggle with #2"},
    {"field_name":"struggle_3","field_type":"text","label":"Thing you struggle with #3"},
    {"field_name":"referring_psychiatrist","field_type":"text","label":"Referring Psychiatrist Name"},
    {"field_name":"referring_contact","field_type":"text","label":"Referring Psychiatrist Contact Details"},
    {"field_name":"section_medication","field_type":"section_header","label":"Current Medication"},
    {"field_name":"drug_allergies","field_type":"radio","label":"Drug allergies?","options":["No","Yes"],"required":true},
    {"field_name":"drug_allergies_detail","field_type":"text","label":"If yes, to what?"},
    {"field_name":"current_medications","field_type":"medication_table","label":"Current Medications","columns":["Name of drug","Strength & Dosage","Number per day","How long"],"max_rows":12},
    {"field_name":"discontinued_meds","field_type":"textarea","label":"Other medications no longer taken that caused significant side effects or did not relieve symptoms"},
    {"field_name":"section_medical_history","field_type":"section_header","label":"Past Medical History"},
    {"field_name":"medical_conditions","field_type":"checkbox_group","label":"Have you now or have ever had:","options":["Diabetes","Heart murmur","Crohn''s disease","High blood pressure","Pneumonia","Colitis","High cholesterol","Pulmonary embolism","Anemia","Hypothyroidism","Asthma","Jaundice","Goiter","Emphysema","Hepatitis","Cancer","Stroke","Stomach or peptic ulcer","Leukemia","Epilepsy (seizures)","Rheumatic fever","Psoriasis","Cataracts","Tuberculosis","Angina","Kidney disease","HIV / AIDS","Heart problems","Kidney stones"]},
    {"field_name":"other_conditions","field_type":"textarea","label":"Other medical conditions (please list)"},
    {"field_name":"section_personal","field_type":"section_header","label":"Personal History"},
    {"field_name":"birth_problems","field_type":"textarea","label":"Were there problems with your birth? (please specify)"},
    {"field_name":"born_raised","field_type":"text","label":"Where were you born and raised?"},
    {"field_name":"education","field_type":"select","label":"Highest Education","options":["High school","College","Degree","Other"]},
    {"field_name":"marital_status","field_type":"select","label":"Marital Status","options":["Never married","Married","Divorced","Separated","Widowed","Partnered/significant other"]},
    {"field_name":"occupation","field_type":"text","label":"Current or past occupation"},
    {"field_name":"currently_working","field_type":"radio","label":"Are you currently working?","options":["Yes","No"]},
    {"field_name":"hours_per_week","field_type":"number","label":"Hours per week (if working)"},
    {"field_name":"not_working_reason","field_type":"select","label":"If not working, reason","options":["Retired","Disabled","Sick leave","Other"]},
    {"field_name":"receives_disability","field_type":"radio","label":"Do you receive disability?","options":["Yes","No"]},
    {"field_name":"disability_detail","field_type":"text","label":"If yes, for what disability and how long?"},
    {"field_name":"legal_problems","field_type":"textarea","label":"Have you ever had legal problems? (specify)"},
    {"field_name":"religion","field_type":"text","label":"Religion"},
    {"field_name":"section_family","field_type":"section_header","label":"Family History"},
    {"field_name":"family_history","field_type":"family_table","label":"Family Members","rows":["Father","Mother","Siblings","Children"],"columns":["If living","If deceased"]},
    {"field_name":"maternal_psych","field_type":"textarea","label":"Extended Family Psychiatric Problems - Maternal Relatives"},
    {"field_name":"paternal_psych","field_type":"textarea","label":"Extended Family Psychiatric Problems - Paternal Relatives"},
    {"field_name":"section_systems","field_type":"section_header","label":"Systems Review - In the past month, have you had any of the following?"},
    {"field_name":"systems_general","field_type":"checkbox_group","label":"General","options":["Recent weight gain","Recent weight loss","Fatigue","Weakness","Fever","Night sweats"]},
    {"field_name":"systems_muscles","field_type":"checkbox_group","label":"Muscle/Joints/Bones","options":["Numbness","Joint pain","Muscle weakness","Joint swelling"]},
    {"field_name":"systems_nervous","field_type":"checkbox_group","label":"Nervous System","options":["Headaches","Dizziness","Fainting or loss of consciousness","Numbness or tingling","Memory loss"]},
    {"field_name":"systems_stomach","field_type":"checkbox_group","label":"Stomach and Intestines","options":["Nausea","Heartburn","Stomach pain","Vomiting","Yellow jaundice","Increasing constipation","Persistent diarrhea","Blood in stools","Black stools"]},
    {"field_name":"systems_psychiatric","field_type":"checkbox_group","label":"Psychiatric","options":["Depression","Excessive worries","Difficulty falling asleep","Difficulty staying awake","Difficulty with sexual arousal","Food cravings","Frequent crying","Sensitivity","Thoughts of suicide/attempts","Stress/Irritability","Poor concentration","Racing thoughts","Hallucinations","Rapid speech"]},
    {"field_name":"systems_eyes","field_type":"checkbox_group","label":"Eyes","options":["Pain","Redness","Loss of vision","Double or blurred vision","Dryness"]},
    {"field_name":"systems_ears","field_type":"checkbox_group","label":"Ears","options":["Ringing in ears","Loss of hearing"]},
    {"field_name":"systems_skin","field_type":"checkbox_group","label":"Skin","options":["Redness","Rash","Nodules/bump","Hair loss","Colour change of hands or feet"]},
    {"field_name":"systems_throat","field_type":"checkbox_group","label":"Throat","options":["Frequent sore throats","Hoarseness","Difficulty in swallowing","Pain in jaw"]},
    {"field_name":"systems_blood","field_type":"checkbox_group","label":"Blood","options":["Anemia","Clots"]},
    {"field_name":"systems_kidney","field_type":"checkbox_group","label":"Kidney/Urine/Bladder","options":["Frequent or painful urination"]},
    {"field_name":"systems_heart_lungs","field_type":"checkbox_group","label":"Heart and Lungs","options":["Chest pain","Palpitations","Shortness of breath","Fainting","Swollen legs or feet","Cough"]},
    {"field_name":"section_women","field_type":"section_header","label":"Women Only"},
    {"field_name":"women_symptoms","field_type":"checkbox_group","label":"Women''s Health","options":["Abnormal Pap smear","Irregular periods","Bleeding between periods","PMS","Menopause"]},
    {"field_name":"age_first_period","field_type":"number","label":"Age at first period"},
    {"field_name":"num_pregnancies","field_type":"number","label":"Number of pregnancies"},
    {"field_name":"num_miscarriages","field_type":"number","label":"Number of miscarriages"},
    {"field_name":"num_abortions","field_type":"number","label":"Number of abortions"},
    {"field_name":"reached_menopause","field_type":"radio","label":"Have you reached menopause?","options":["Yes","No"]},
    {"field_name":"menopause_age","field_type":"number","label":"At what age?"},
    {"field_name":"regular_periods","field_type":"radio","label":"Do you have regular periods?","options":["Yes","No"]},
    {"field_name":"section_substance","field_type":"section_header","label":"Substance Use"},
    {"field_name":"substance_use","field_type":"substance_table","label":"Substance Use History","rows":["Cannabis/Marijuana/Hashish","Stimulants - Cocaine/Crack","Methamphetamine - Speed/Ice/Crank","Amphetamines/Ritalin/Benzedrine","Benzodiazepines - Valium/Xanax/Diazepam","Sedatives/Barbiturates","Heroin","Street/Illicit Methadone","Other Opioids - Morphine/Codeine","Hallucinogens - LSD/Mushrooms/Ecstasy","Inhalants - Glue/Aerosols","Other"],"columns":["Age first used","How much","How often","For how many years","When last used","Currently still use"]},
    {"field_name":"consent_drug_testing","field_type":"checkbox","label":"I agree to random drug testing if indicated"},
    {"field_name":"section_signatures","field_type":"section_header","label":"Declaration"},
    {"field_name":"patient_name_confirm","field_type":"text","label":"Patient Name and Surname","required":true},
    {"field_name":"patient_signature","field_type":"signature","label":"Patient Signature","required":true},
    {"field_name":"date_signed","field_type":"date","label":"Date Completed","required":true},
    {"field_name":"guardian_name_sig","field_type":"text","label":"Parent or Guardian Name (if applicable)"},
    {"field_name":"guardian_position","field_type":"text","label":"Position"},
    {"field_name":"guardian_signature","field_type":"signature","label":"Guardian Signature"}
  ]'::jsonb,
  4
);

-- 5. Patient Information for Iron Infusions
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'Patient Information - Iron Infusions',
  'Informational document about iron infusion therapy with acknowledgement.',
  'consent',
  '[
    {"field_name":"section_what","field_type":"section_header","label":"What is an Iron Infusion?"},
    {"field_name":"info_what","field_type":"info_text","label":"","content":"An iron infusion is a treatment where iron is given through a vein and directly enters the bloodstream (intravenous/IV iron). A needle/cannula is placed in the arm or the back of the hand, connected to a saline solution drip with iron mixed in. Compounds commonly administered include Monofer, Ferinject and Venofer. Your treating doctor will prescribe the most suited compound."},
    {"field_name":"info_how","field_type":"info_text","label":"","content":"The infusion is administered through a pump over approximately 30 minutes. Some compounds require a test dose first. Expect to be at the practice for about 1.5 hours. You will wait 30 minutes post procedure before discharge."},
    {"field_name":"info_after","field_type":"info_text","label":"","content":"After discharge: Stop iron tablets the day before your appointment. Restart 7 days post infusion or as prescribed. Fasting is not required. Drink plenty of fluids on the day. Benefits are usually felt about 2 weeks after. Blood tests advisable 6 weeks post infusion."},
    {"field_name":"section_side_effects","field_type":"section_header","label":"Potential Side Effects"},
    {"field_name":"info_side_effects","field_type":"info_text","label":"","content":"The most common side effect is a metallic taste (disappears within 15 minutes). Other possible effects include:\n- Flushing\n- Back pain\n- Rash\n- Nausea\n- Headache\n- Dizziness\n- Changes in blood pressure or pulse\n- Injection site reactions (redness, swelling, bruising)\n\nDelayed reactions (joint pain, muscle pain, fever) may occur up to 4 days after. If you experience an allergic reaction after leaving, take an antihistamine and go to your nearest Emergency Department."},
    {"field_name":"section_contraindications","field_type":"section_header","label":"You should NOT receive Iron infusions if:"},
    {"field_name":"info_contra","field_type":"info_text","label":"","content":"1. You have known liver damage\n2. You have any acute or chronic infections\n3. You have been diagnosed with Mastocytosis\n4. You are in your first trimester of pregnancy\n5. You have Rheumatoid arthritis with current symptoms"},
    {"field_name":"acknowledge","field_type":"checkbox","label":"I have read and understood the above information about iron infusion therapy","required":true},
    {"field_name":"patient_name","field_type":"text","label":"Patient Name","required":true},
    {"field_name":"patient_signature","field_type":"signature","label":"Patient Signature","required":true},
    {"field_name":"acknowledge_date","field_type":"date","label":"Date","required":true}
  ]'::jsonb,
  5
);

-- 6. Iron Pre-Infusion Questionnaire
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'Iron Infusion Pre-Questionnaire',
  'Pre-infusion screening questionnaire for iron infusion patients.',
  'medical_questionnaire',
  '[
    {"field_name":"section_patient","field_type":"section_header","label":"Patient Information"},
    {"field_name":"patient_name","field_type":"text","label":"Name","required":true},
    {"field_name":"allergies","field_type":"text","label":"Allergies","required":true},
    {"field_name":"age","field_type":"number","label":"Age","required":true},
    {"field_name":"weight","field_type":"number","label":"Weight (kg)","required":true},
    {"field_name":"prior_infusion","field_type":"radio","label":"Have you had an infusion before?","options":["Yes","No"],"required":true},
    {"field_name":"prior_reactions","field_type":"textarea","label":"If yes, what were the specific reactions?"},
    {"field_name":"current_medications","field_type":"textarea","label":"Current medications or treatments","required":true},
    {"field_name":"section_conditions","field_type":"section_header","label":"Do you have any of the following conditions?"},
    {"field_name":"conditions","field_type":"checkbox_group","label":"Conditions","options":["Asthma","Eczema","Skin allergies","Rheumatoid arthritis (with symptoms)","Kidney failure","Any present infection","Liver cirrhosis and/or hepatitis","Lupus","Taking beta-blockers or ACE inhibitors","Mastocytosis","First trimester pregnancy"]},
    {"field_name":"conditions_detail","field_type":"textarea","label":"If yes to any of the above, please provide more details"},
    {"field_name":"info_allergic","field_type":"info_text","label":"","content":"I understand that if an allergic reaction is noted during administration, the needed medical intervention will be provided and the iron infusion may not be completed."},
    {"field_name":"emergency_contact","field_type":"text","label":"Emergency Contact Name and Number","required":true},
    {"field_name":"declaration","field_type":"info_text","label":"","content":"I hereby state that I have answered this questionnaire truthfully and to the best of my knowledge."},
    {"field_name":"patient_signature","field_type":"signature","label":"Patient Signature","required":true},
    {"field_name":"date_signed","field_type":"date","label":"Date","required":true},
    {"field_name":"rn_signature","field_type":"signature","label":"RN Name and Signature"},
    {"field_name":"section_clinical","field_type":"section_header","label":"Clinical Information (Staff Use)"},
    {"field_name":"referring_doctor","field_type":"text","label":"Referring Doctor"},
    {"field_name":"diagnosis","field_type":"textarea","label":"Current Diagnosis / Complaint"},
    {"field_name":"clinical_allergies","field_type":"text","label":"Allergies"},
    {"field_name":"clinical_medications","field_type":"textarea","label":"Current Medication"},
    {"field_name":"medical_history","field_type":"textarea","label":"Medical History - Current Chronic Conditions"},
    {"field_name":"surgical_history","field_type":"textarea","label":"Surgical History / Operations"}
  ]'::jsonb,
  6
);

-- 7. IV Infusion Monitoring (Short)
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'IV Infusion Monitoring',
  'Standard intravenous infusion monitoring form with vitals tracking.',
  'monitoring',
  '[
    {"field_name":"section_info","field_type":"section_header","label":"Infusion Details"},
    {"field_name":"infusion_date","field_type":"date","label":"Date","required":true},
    {"field_name":"infusion_number","field_type":"number","label":"Infusion No."},
    {"field_name":"iv_site","field_type":"text","label":"IV Insertion Site","required":true},
    {"field_name":"patient_name","field_type":"text","label":"Patient Name","required":true},
    {"field_name":"allergies","field_type":"text","label":"Allergies","required":true},
    {"field_name":"drug_dosage","field_type":"text","label":"Drug and Dosage","required":true},
    {"field_name":"batch_no","field_type":"text","label":"Drug Batch No."},
    {"field_name":"expiry_date","field_type":"date","label":"Drug Expiry Date"},
    {"field_name":"prescribing_doctor","field_type":"text","label":"Prescribing Doctor","required":true},
    {"field_name":"doctor_pr_no","field_type":"text","label":"Doctor Pr No."},
    {"field_name":"section_baseline","field_type":"section_header","label":"Baseline Vitals"},
    {"field_name":"baseline_time","field_type":"text","label":"Time"},
    {"field_name":"baseline_vitals","field_type":"vitals_row","label":"Baseline","fields":["BP","Pulse","Temp","Sats","RR"]},
    {"field_name":"test_dose","field_type":"text","label":"Test Dose"},
    {"field_name":"pre_medication","field_type":"textarea","label":"Pre-medication Administered"},
    {"field_name":"section_monitoring","field_type":"section_header","label":"First Hour - Record Vitals Every 15min"},
    {"field_name":"monitoring_vitals","field_type":"vitals_table","label":"Continual Monitoring","columns":["Time","BP mmHg","Pulse","Sats %","RR/min","Temp °C","Comments"],"max_rows":8},
    {"field_name":"infusion_start","field_type":"text","label":"Infusion Start Time","required":true},
    {"field_name":"infusion_end","field_type":"text","label":"Infusion End Time","required":true},
    {"field_name":"section_post","field_type":"section_header","label":"Post Infusion Vitals"},
    {"field_name":"post_time","field_type":"text","label":"Time"},
    {"field_name":"post_vitals","field_type":"vitals_row","label":"Post Infusion","fields":["BP","Pulse","Temp °C","Sats %","RR/min"]},
    {"field_name":"rn_signature_1","field_type":"signature","label":"RN Signature"},
    {"field_name":"rn_signature_2","field_type":"signature","label":"RN Signature (2nd)"},
    {"field_name":"section_discharge","field_type":"section_header","label":"Discharge"},
    {"field_name":"discharge_comments","field_type":"textarea","label":"Discharge Comments"},
    {"field_name":"section_cleaning","field_type":"section_header","label":"Cleaning Record Post Infusion"},
    {"field_name":"cleaning_checklist","field_type":"checkbox_group","label":"Items Cleaned","options":["Reclining Chair","Drip Stand","Monitoring Equipment and Accessories","Side Table","Infusion Pump"]}
  ]'::jsonb,
  7
);

-- 8. Revellex/Remsima Infusion Monitoring
INSERT INTO public.form_templates (name, description, category, form_schema, display_order) VALUES (
  'Revellex/Remsima Infusion Monitoring',
  'Biological infusion monitoring form with pre-medication tracking and protocol selection.',
  'monitoring',
  '[
    {"field_name":"section_info","field_type":"section_header","label":"Infusion Details"},
    {"field_name":"patient_name","field_type":"text","label":"Patient Name","required":true},
    {"field_name":"infusion_date","field_type":"date","label":"Date","required":true},
    {"field_name":"infusion_number","field_type":"number","label":"Infusion No."},
    {"field_name":"weight","field_type":"number","label":"Weight (kg)"},
    {"field_name":"nurse_mask","field_type":"checkbox","label":"Nurse Mask On"},
    {"field_name":"patient_mask","field_type":"checkbox","label":"Patient Mask On"},
    {"field_name":"time_in","field_type":"text","label":"Time IN","required":true},
    {"field_name":"time_out","field_type":"text","label":"Time OUT"},
    {"field_name":"dosage","field_type":"text","label":"Dosage","required":true},
    {"field_name":"dosage_basis","field_type":"text","label":"Based on"},
    {"field_name":"prescribing_doctor","field_type":"text","label":"Prescribing Doctor","required":true},
    {"field_name":"doctor_pr_no","field_type":"text","label":"Doctor Pr No."},
    {"field_name":"section_pre_assessment","field_type":"section_header","label":"Pre-infusion Assessment"},
    {"field_name":"current_infections","field_type":"textarea","label":"Current Infections"},
    {"field_name":"section_pre_med","field_type":"section_header","label":"Pre-Infusion Medication"},
    {"field_name":"paracetamol_dose","field_type":"text","label":"Paracetamol Dose"},
    {"field_name":"paracetamol_time","field_type":"text","label":"Paracetamol Time"},
    {"field_name":"paracetamol_route","field_type":"text","label":"Paracetamol Route"},
    {"field_name":"paracetamol_lot","field_type":"text","label":"Paracetamol Lot No."},
    {"field_name":"paracetamol_exp","field_type":"text","label":"Paracetamol Exp. Date"},
    {"field_name":"cortisone_name","field_type":"text","label":"Cortisone Name"},
    {"field_name":"cortisone_dose","field_type":"text","label":"Cortisone Dose"},
    {"field_name":"cortisone_time","field_type":"text","label":"Cortisone Time"},
    {"field_name":"cortisone_route","field_type":"text","label":"Cortisone Route"},
    {"field_name":"cortisone_lot","field_type":"text","label":"Cortisone Lot No."},
    {"field_name":"cortisone_exp","field_type":"text","label":"Cortisone Exp. Date"},
    {"field_name":"antihistamine_name","field_type":"text","label":"Anti-histamine Name"},
    {"field_name":"antihistamine_dose","field_type":"text","label":"Anti-histamine Dose"},
    {"field_name":"antihistamine_time","field_type":"text","label":"Anti-histamine Time"},
    {"field_name":"antihistamine_route","field_type":"text","label":"Anti-histamine Route"},
    {"field_name":"antihistamine_lot","field_type":"text","label":"Anti-histamine Lot No."},
    {"field_name":"antihistamine_exp","field_type":"text","label":"Anti-histamine Exp. Date"},
    {"field_name":"section_remsima","field_type":"section_header","label":"REMSIMA Lot Tracking"},
    {"field_name":"remsima_lot_1","field_type":"text","label":"Lot No. 1"},
    {"field_name":"remsima_exp_1","field_type":"text","label":"Exp. Date 1"},
    {"field_name":"remsima_lot_2","field_type":"text","label":"Lot No. 2"},
    {"field_name":"remsima_exp_2","field_type":"text","label":"Exp. Date 2"},
    {"field_name":"remsima_lot_3","field_type":"text","label":"Lot No. 3"},
    {"field_name":"remsima_exp_3","field_type":"text","label":"Exp. Date 3"},
    {"field_name":"remsima_lot_4","field_type":"text","label":"Lot No. 4"},
    {"field_name":"remsima_exp_4","field_type":"text","label":"Exp. Date 4"},
    {"field_name":"remsima_lot_5","field_type":"text","label":"Lot No. 5"},
    {"field_name":"remsima_exp_5","field_type":"text","label":"Exp. Date 5"},
    {"field_name":"remsima_lot_6","field_type":"text","label":"Lot No. 6"},
    {"field_name":"remsima_exp_6","field_type":"text","label":"Exp. Date 6"},
    {"field_name":"section_baseline","field_type":"section_header","label":"Baseline Vitals"},
    {"field_name":"baseline_time","field_type":"text","label":"Time"},
    {"field_name":"baseline_vitals","field_type":"vitals_row","label":"Baseline","fields":["BP","Pulse","Temp","Sats %","RR/min"]},
    {"field_name":"section_protocol","field_type":"section_header","label":"Infusion Protocol"},
    {"field_name":"protocol","field_type":"radio","label":"Protocol","options":["Standard (120 min)","Accelerated (60 min)"],"required":true},
    {"field_name":"protocol_info","field_type":"info_text","label":"","content":"Standard: 10ml/hr x 15min → 20ml/hr x 15min → 40ml/hr x 15min → 80ml/hr x 15min → 150ml/hr x 30min → 250ml/hr until done\n\nAccelerated: 100ml/hr x 15min → 300ml/hr x 45min until done"},
    {"field_name":"section_monitoring","field_type":"section_header","label":"Continual Monitoring - Record Vitals Every 15min"},
    {"field_name":"monitoring_vitals","field_type":"vitals_table","label":"Monitoring","columns":["Time","BP mmHg","Pulse","Sats %","RR/min","Temp °C","Rate","Comments"],"max_rows":12},
    {"field_name":"section_reactions","field_type":"section_header","label":"Reactions / Adverse Events"},
    {"field_name":"reactions","field_type":"textarea","label":"Reactions or adverse events during the infusion"},
    {"field_name":"section_post","field_type":"section_header","label":"Post Infusion Vitals"},
    {"field_name":"post_time","field_type":"text","label":"Time"},
    {"field_name":"post_vitals","field_type":"vitals_row","label":"Post Infusion","fields":["BP","Pulse","Temp °C","Sats %","RR/min"]},
    {"field_name":"section_discharge","field_type":"section_header","label":"Discharge"},
    {"field_name":"discharge_comments","field_type":"textarea","label":"Discharge Comments"},
    {"field_name":"section_cleaning","field_type":"section_header","label":"Cleaning Record Post Infusion"},
    {"field_name":"cleaning_checklist","field_type":"checkbox_group","label":"Items Cleaned","options":["Reclining Chair","Drip Stand","Monitoring Equipment and Accessories","Side Table","Infusion Pump"]}
  ]'::jsonb,
  8
);
