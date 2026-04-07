

## Plan: Add Render Mode & Slug Controls to Form Template Editor

### Problem
The `render_mode` and `slug` fields exist in the database but can only be changed via direct DB edits. Admins need UI controls in the Form Template Editor to set a template to "facsimile" mode and assign the correct slug.

### Changes

**File: `src/components/forms/FormTemplateEditor.tsx`**

1. Add two new state variables: `renderMode` (default `"schema"`) and `slug` (default `""`)
2. Initialize them from the template on open (lines ~106-136)
3. Include them in the save payload (lines ~182-208)
4. Add a "Render Mode" select dropdown and a "Slug" text input to the settings panel, near the existing Category/Status controls. Options: Schema (default form builder), PDF Overlay, Facsimile (pixel-perfect custom layout)
5. Show the slug input only when render mode is "facsimile" — with a helper note listing available slugs from the registry

**File: `src/components/forms/facsimile/registry.ts`**
- Export the available slug keys so the editor can display them as guidance

### No database or backend changes needed
The columns already exist.

