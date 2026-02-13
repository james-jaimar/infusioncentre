
UPDATE form_templates 
SET required_for_treatment_types = ARRAY['bf594551-d4f0-4a13-93ff-1de125380511'::uuid]
WHERE id IN (
  '2cd5dbfb-edc5-46f0-a04e-fa900bea4fd8',
  'f20ffca1-6b9f-4287-b3e8-06fdcaafcd61'
);

UPDATE form_templates 
SET required_for_treatment_types = ARRAY['37b819cf-c3ee-4083-86b7-4c3e78049796'::uuid]
WHERE id IN (
  '7192cece-d9bd-4b13-a99f-0b7737a542f8',
  '118121fb-e7d1-42ec-9311-cf9b51a0c5f8'
);

UPDATE form_templates 
SET required_for_treatment_types = ARRAY[
  '37b819cf-c3ee-4083-86b7-4c3e78049796'::uuid,
  '7248fe1f-837c-48fd-9286-d418b431fd50'::uuid,
  '389477e1-a6f2-48ae-abf4-fd4e5805374f'::uuid,
  '4c099ed2-6cca-4a06-a49d-2fdd1025fa6a'::uuid
]
WHERE id = '4475d207-751d-4b5a-984f-b32b042c6ef0';

UPDATE form_templates 
SET required_for_treatment_types = ARRAY['4c099ed2-6cca-4a06-a49d-2fdd1025fa6a'::uuid]
WHERE id = '8e524179-efea-4a71-bb9e-166ab302d89a';
