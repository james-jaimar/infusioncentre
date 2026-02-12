

# AI-Powered Form Template Editor for Gayle

## Overview

Build two capabilities into the admin Form Templates page so Gayle can maintain forms herself:

1. **AI Document Import** -- Upload a PDF/Word document or scan, and AI extracts the content into a structured form template automatically
2. **Visual Form Editor** -- A drag-and-drop interface to manually add, edit, reorder, and delete fields and text blocks

Together, Gayle can import a new form from a document, then fine-tune it visually before publishing.

## What Gets Built

### 1. AI Form Importer

A button on the Form Templates page: **"Import from Document"**

- Opens a dialog where Gayle uploads a PDF, Word doc, or image/scan
- The file is sent to an edge function that uses Lovable AI (Gemini) to extract and structure the form
- AI identifies: section headers, info/terms text blocks, input fields (text, date, checkbox, signature, etc.), and their types
- Returns a preview of the generated form template
- Gayle reviews the preview, makes any tweaks in the visual editor, then saves

### 2. Visual Form Editor

A full-screen editor (similar to the existing form preview dialog) with:

- **Field palette** on the side: drag or click to add section headers, info text, text fields, checkboxes, signatures, etc.
- **Inline editing**: click any field to edit its label, placeholder, options, or content text
- **Drag to reorder**: grab handle on each field to reposition
- **Delete**: remove any field
- **Rich text for info_text blocks**: a textarea where Gayle can write/paste the terms, side effects, contraindications etc.
- **Save and Version**: saves update the form_schema in the database, incrementing the version number

### 3. Edit existing templates

An "Edit" button alongside the existing "Preview" and "Delete" buttons on each template row, opening the visual editor pre-loaded with that template's schema.

---

## Technical Details

### New files to create

| File | Purpose |
|---|---|
| `src/components/forms/FormTemplateEditor.tsx` | Visual drag-and-drop form builder component |
| `src/components/forms/FieldPalette.tsx` | Sidebar with available field types to add |
| `src/components/forms/FieldEditor.tsx` | Inline editor panel for a selected field's properties |
| `src/components/forms/AIImportDialog.tsx` | Upload dialog that sends document to AI for extraction |
| `supabase/functions/extract-form-template/index.ts` | Edge function that receives the uploaded file, uses Lovable AI to parse it into a form_schema JSON structure |

### Files to modify

| File | Changes |
|---|---|
| `src/pages/admin/AdminFormTemplates.tsx` | Add "Import from Document" button, "Edit" button per row, wire up editor and import dialogs |
| `src/hooks/useFormTemplates.ts` | No changes needed -- already has create/update/delete mutations |

### AI extraction approach

The edge function will:
1. Receive the uploaded document (as base64 or form data)
2. If it's a PDF/image, extract text (using the document content directly -- Gemini handles multimodal input)
3. Send the text to Lovable AI with a structured prompt asking it to return a `form_schema` array matching the existing FormField interface
4. Use tool calling to extract structured JSON output (not freeform JSON)
5. Return the structured schema to the frontend

The prompt will include examples of the existing field types (section_header, info_text, text, textarea, checkbox, signature, medication_table, etc.) so the AI maps document content accurately.

### Visual editor approach

- Uses React state to manage an array of FormField objects
- Each field rendered as an editable card with drag handle
- For reordering: simple move-up/move-down buttons (simpler and more reliable than full drag-and-drop library)
- Selected field opens a property panel on the right side
- "Preview" button renders the form using the existing FormRenderer in read-only mode
- "Save" calls `useUpdateFormTemplate` or `useCreateFormTemplate` depending on context

### Edge cases

- If AI extraction produces poor results, Gayle can fix everything in the visual editor
- Version number auto-increments on save so there's an audit trail
- Existing form submissions are not affected by template edits (they store their own data snapshot)
- Large documents: the edge function limits to reasonable text size for AI processing

### Implementation order

1. Create the edge function for AI document extraction
2. Build the AI Import Dialog component
3. Build the Field Palette and Field Editor components
4. Build the main Form Template Editor (full-screen)
5. Wire everything into AdminFormTemplates page
6. Test end-to-end: upload a document, review AI output, edit, save, preview

