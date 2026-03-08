-- Seed vitals thresholds
INSERT INTO public.vitals_thresholds (protocol_id) VALUES (NULL);

-- Seed protocols
INSERT INTO public.treatment_protocols (treatment_type_id, name, description, vitals_interval_initial_mins, vitals_interval_standard_mins, vitals_initial_period_mins, post_infusion_observation_mins, min_vitals_during, min_vitals_post)
VALUES 
  ('37b819cf-c3ee-4083-86b7-4c3e78049796', 'Iron Infusion Protocol', 'Monitor for anaphylaxis risk in first 15 minutes.', 5, 15, 30, 30, 3, 1),
  ('bf594551-d4f0-4a13-93ff-1de125380511', 'Ketamine Infusion Protocol', 'Enhanced monitoring. Vitals every 10 min throughout, extended observation.', 10, 10, 120, 60, 6, 2),
  ('7248fe1f-837c-48fd-9286-d418b431fd50', 'IV Vitamin Therapy Protocol', 'Standard monitoring for vitamin infusions.', 15, 30, 60, 15, 2, 1),
  ('4c099ed2-6cca-4a06-a49d-2fdd1025fa6a', 'Biologics Infusion Protocol', 'Close monitoring for biologic agents.', 10, 15, 60, 30, 4, 1),
  ('389477e1-a6f2-48ae-abf4-fd4e5805374f', 'Blood Transfusion Protocol', 'Strict monitoring per transfusion guidelines.', 5, 15, 30, 30, 4, 1)
ON CONFLICT (treatment_type_id, version) DO NOTHING;

-- Discharge criteria for non-ketamine protocols
INSERT INTO public.discharge_criteria (protocol_id, criterion_key, display_label, description, rule_config, is_required, display_order)
SELECT p.id, c.ckey, c.clabel, c.cdescription, c.ccfg::jsonb, true, c.cord
FROM public.treatment_protocols p
CROSS JOIN (VALUES
  ('vitals_stable', 'Vitals within normal range', 'Final vitals within acceptable limits', '{"bp_systolic_max":160,"bp_diastolic_max":100,"hr_min":50,"hr_max":120,"o2_min":92}', 1),
  ('observation_complete', 'Observation period complete', 'Required observation time elapsed', '{}', 2),
  ('no_active_reaction', 'No active adverse reactions', 'No ongoing reactions requiring intervention', '{}', 3),
  ('patient_alert', 'Patient alert and oriented', 'Patient conscious and responsive', '{}', 4),
  ('iv_site_checked', 'IV site checked and dressed', 'IV removed, site inspected and dressed', '{}', 5)
) AS c(ckey, clabel, cdescription, ccfg, cord)
WHERE p.name != 'Ketamine Infusion Protocol';

-- Ketamine criteria with extra dissociation
INSERT INTO public.discharge_criteria (protocol_id, criterion_key, display_label, description, rule_config, is_required, display_order)
SELECT p.id, c.ckey, c.clabel, c.cdescription, c.ccfg::jsonb, true, c.cord
FROM public.treatment_protocols p
CROSS JOIN (VALUES
  ('vitals_stable', 'Vitals within normal range', 'Final vitals within acceptable limits', '{"bp_systolic_max":150,"bp_diastolic_max":95,"hr_min":55,"hr_max":110,"o2_min":94}', 1),
  ('observation_complete', 'Extended observation complete', '60 minute observation period complete', '{"observation_mins":60}', 2),
  ('no_active_reaction', 'No active adverse reactions', 'No ongoing reactions', '{}', 3),
  ('patient_alert', 'Patient fully alert and oriented', 'Oriented to person, place, time', '{}', 4),
  ('iv_site_checked', 'IV site checked and dressed', 'IV removed and site dressed', '{}', 5),
  ('dissociation_resolved', 'Dissociation resolved', 'Dissociation score returned to baseline', '{"max_dissociation_score":1}', 6)
) AS c(ckey, clabel, cdescription, ccfg, cord)
WHERE p.name = 'Ketamine Infusion Protocol';

-- Set observation_mins
UPDATE public.discharge_criteria dc
SET rule_config = jsonb_build_object('observation_mins', p.post_infusion_observation_mins)
FROM public.treatment_protocols p
WHERE dc.protocol_id = p.id AND dc.criterion_key = 'observation_complete' AND dc.rule_config = '{}'::jsonb;