
Do I know what the issue is? Yes: this is not one stubborn field bug. The public-form system has accumulated layered fixes across page logic, renderer logic, edge-function logic, AI-import rules, and bad live template data. That is why “any form” can still fail in inconsistent ways.

What I found

- The main public-form flow is split across:
  - `src/pages/PublicForm.tsx`
  - `src/components/forms/FormRenderer.tsx`
  - `src/components/forms/PdfOverlayRenderer.tsx`
  - `src/components/forms/FieldEditor.tsx`
  - `src/components/forms/FormTemplateEditor.tsx`
  - `src/pages/admin/AdminFormTemplates.tsx`
  - `supabase/functions/submit-public-form/index.ts`
  - `supabase/functions/extract-form-template/index.ts`
- `Ketamine_Questionnaire - General 2025` still has 0 submissions, so the block is happening in the browser before the edge function.
- The live template data is also wrong, not just the code:
  - `Ketamine_Questionnaire - General 2025` still has unconditional required guardian fields plus duplicate required patient-name fields.
  - Similar schema problems exist in other active forms (`Ketamine Pre-Infusion Questionnaire`, POPI consent, Patient Information & Agreement for Care).
- There is an upstream schema bug too: AI extraction instructs checkbox conditionals as `"value": "true"` strings, but the renderer checks strict equality against boolean `true`, so conditional follow-up fields can silently break.
- The admin field editor does not expose `conditional_on`, `group`, `density`, or `layout_hint`, so once bad schema lands, it is difficult to repair properly.
- Validation is duplicated and inconsistent:
  - `PublicForm` does identity inference + required checks
  - `FormRenderer` only renders + partial error display
  - `PdfOverlayRenderer` has no comparable validation/error system
  - `submit-public-form` has its own separate rules

Clean rewrite plan

1. Build one shared form-runtime layer
- Create a single source of truth for:
  - field visibility
  - required-field evaluation
  - empty-value checks by field type
  - conditional coercion (`true` vs `"true"`, string/number cases)
  - patient identity resolution
- Make the page, renderers, and edge function all use this same contract.

2. Strip `PublicForm.tsx` back to orchestration only
- Remove the current page-level pattern matching and identity extraction.
- Keep `PublicForm` responsible only for:
  - loading the template
  - storing values
  - receiving structured validation errors
  - submitting a validated payload

3. Rewrite validation UX cleanly
- Use one validation result shape for schema, pdf_overlay, and facsimile modes.
- Show inline errors and jump to the first invalid visible field.
- Fix progress so it only counts visible required fields.
- Add the same error-anchor support to `PdfOverlayRenderer`.

4. Clean out the bad live template data
- Create a migration to normalize the active public form schemas.
- First pass:
  - remove unconditional guardian requirements where labels say “if under age” / “if applicable”
  - reduce duplicate patient-name requirements
  - repair broken conditionals
- Prioritize:
  - `Ketamine_Questionnaire - General 2025`
  - `Ketamine Pre-Infusion Questionnaire`
  - `The-Infusion-Centre_Patient-POPI-Consent - Amended April 23`
  - `Patient Information & Agreement for Care`

5. Fix the authoring pipeline so this does not return
- Update `extract-form-template` rules so conditionals are emitted in a runtime-safe way.
- Add template linting/warnings before save for:
  - multiple required patient-name fields
  - unconditional guardian fields
  - broken `conditional_on` references
  - ambiguous identity mapping
- Extend the field editor so admins can actually edit `conditional_on`, layout/group metadata, and other schema controls.
- Make editor preview use the real render mode, not just the schema renderer.

6. Align `submit-public-form` with the rewrite
- Keep server validation as a backstop, not a second conflicting rules engine.
- Return field-level failures where possible instead of vague submission errors.

7. Test every active public form end-to-end
- Open each public slug, complete it, submit it, and verify saved submissions.
- Test missing required fields, conditional fields, duplicate-name scenarios, and all render modes.

Expected outcome

- one validation system
- one identity-resolution system
- cleaner `form_templates` data
- no more stacked “fixes on fixes”
- reliable submission across all public forms, not just a ketamine patch
