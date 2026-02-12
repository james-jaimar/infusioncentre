

# Add "Re-import from Document" to Existing Templates

## The Problem

The AI import flow currently always creates a new template. If Gayle has an updated version of a consent form (e.g., updated terms), she has no way to upload the new document and have it replace the existing template's fields. She'd have to create a new template and delete the old one, losing the link to existing submissions.

## What Changes

### 1. "Re-import" button inside the Form Template Editor

When editing an **existing** template, add an **"Upload / Re-import"** button in the editor's top bar (next to Preview and Save). Clicking it opens the same AI Import Dialog, but instead of creating a new template, the extracted schema replaces the current editor fields. Gayle can then review, tweak, and save — updating the existing template in place with an incremented version number.

### 2. "Re-import" action on the templates table

Add a small upload icon button alongside Edit / Preview / Delete on each template row. This opens the AI Import Dialog, and when extraction completes, it opens the editor for that template pre-loaded with the new AI-extracted schema (but keeping the existing template's name, category, and ID so it saves as an update).

## How It Works (for Gayle)

1. Find the form she wants to update in the templates list
2. Click the upload icon (or open the editor and click "Re-import")
3. Upload the updated PDF/scan
4. AI extracts the new fields and content
5. The editor opens showing the new fields, with the existing template name/category pre-filled
6. She reviews, tweaks if needed, and clicks Save
7. The template updates in place (version increments), existing submissions are unaffected

---

## Technical Details

### Files to modify

| File | Changes |
|---|---|
| `src/pages/admin/AdminFormTemplates.tsx` | Add re-import button per row, add state to track which template is being re-imported, pass template to AIImportDialog |
| `src/components/forms/AIImportDialog.tsx` | Accept optional `templateId` prop; pass it through to `onImported` callback so the parent knows this is an update |
| `src/components/forms/FormTemplateEditor.tsx` | Add "Re-import" button in the editor header bar that opens the AI Import Dialog; when AI returns, replace the current fields array |

### AdminFormTemplates.tsx changes

- Add state: `reimportTemplate` to track which existing template is being re-imported
- Add an Upload icon button in each table row's actions
- When AI import completes during a re-import: set `editingTemplate` to the existing template AND set `importedSchema` to the AI-extracted schema
- The `FormTemplateEditor` already handles this combo: when both `template` and `initialSchema` are provided, it should use the template's metadata (name, category, ID) but the imported schema for fields

### FormTemplateEditor.tsx changes

- Update the `useEffect` initialisation logic: when `template` AND `initialSchema` are both provided, use `template` for name/description/category/isActive but `initialSchema` for the fields array
- Add a "Re-import" button in the header bar (only shown when editing an existing template)
- This button opens a local AIImportDialog; when extraction completes, call `setFields(newSchema)` to replace the current fields
- The existing Save logic already handles updates (it checks `template?.id`)

### AIImportDialog.tsx changes

- No structural changes needed; it already returns the extracted schema via `onImported`
- The parent component controls what happens with the result

### Current initialisation logic (line 97-115)

Currently:
- If `template` exists: use template's schema and metadata
- Else: use `initialSchema` / `initialName` etc.

Updated logic:
- If `template` exists AND `initialSchema` exists: use template's metadata + `initialSchema` for fields (re-import scenario)
- If `template` exists (no initialSchema): use template's schema and metadata (normal edit)
- Else: use initialSchema / initialName etc. (new from AI import)

