
Problem found

- This is failing before the form is ever sent. The red toast in your screenshot matches the client-side check in `src/pages/PublicForm.tsx` (`Please fill in your name`).
- There are no recent `form_submissions` for `Ketamine_Questionnaire - General 2025`, so the block is happening in the browser, not in the edge function.
- The current public-form identity logic is too brittle:
  - it hides the fallback first/last-name inputs as soon as it sees any “name-like” field
  - it then tries to derive the respondent name from a narrow set of field patterns
  - across your live templates, name fields vary a lot (`name_in_full`, `patient_name_surname`, `patient_guardian_name`, etc.)
- The ketamine template data also needs cleanup: `parent_guardian_name` is currently marked `required: true` with no condition, even though the label says “if under age”.

Plan

1. Fix identity resolution in `src/pages/PublicForm.tsx`
- Replace the current `detectIdentityFields` / `extractFromValues` logic with a normalized matcher that handles spaces, underscores, and more real field variants.
- Separate true patient-name fields from guardian / witness / doctor / representative fields.
- Only hide the manual name card when there is a confident patient-name source.
- If name still cannot be resolved, reveal and focus the manual name inputs instead of blocking with a vague toast.

2. Fix validation UX across public forms
- Move from toast-only validation to field-level validation.
- Validate only visible required fields.
- Scroll to the first invalid field on submit.
- Show a clearer summary like “Please fix the highlighted fields” instead of leaving users stranded at the bottom.

3. Update the form renderer for inline errors
- Extend `src/components/forms/FormRenderer.tsx` so public forms can highlight missing fields and show small error messages under them.
- Add stable field anchors/ids so `PublicForm` can jump directly to the problem area.

4. Clean up the ketamine template data
- Audit the ketamine public templates for bad required flags and duplicate name capture.
- Fix `Ketamine_Questionnaire - General 2025` so the guardian field is not always mandatory.
- Review signature-adjacent text fields near the bottom so they are only required when legally intended.

5. Add a server-side safety backstop
- Align `supabase/functions/submit-public-form/index.ts` with the improved client rules so future regressions return clear errors instead of silent confusion.
- Keep the payload validation strict, but with better diagnostics.

Technical notes

- Main files: `src/pages/PublicForm.tsx`, `src/components/forms/FormRenderer.tsx`, `supabase/functions/submit-public-form/index.ts`
- Data fix: update the affected `form_templates` rows for the ketamine questionnaires
- Expected outcome: users can complete and submit these long public forms successfully, and if something is missing, the UI will take them straight to the exact field instead of showing a generic bottom-page error
