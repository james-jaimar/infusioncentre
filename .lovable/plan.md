

## Plan: Drag-and-Drop File Upload for Referral Form

### What Changes

Replace the small "Choose files" button in the Attachments card with a full drag-and-drop zone that also accepts clicks, making it easy for doctors to drag files from WhatsApp Desktop, email, or file explorer.

### Implementation

**File: `src/pages/doctor/DoctorNewReferral.tsx`**

1. Add `dragging` state (`useState<boolean>(false)`)
2. Replace the current hidden input + label (lines 287-291) with a large drop zone `div` that:
   - Has `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` handlers
   - Shows a dashed border area with an upload icon, "Drag & drop files here" text, and a secondary "or click to browse" label
   - Highlights with a blue/primary border tint when files are dragged over (`dragging` state)
   - Still contains the hidden `<input>` triggered on click
   - Accepts `.pdf, .jpg, .jpeg, .png, .doc, .docx, .heic, .webp` (broader format support for WhatsApp exports)
3. The `onDrop` handler calls `e.preventDefault()`, extracts `e.dataTransfer.files`, and appends them to the `files` state (same as `handleFileAdd`)
4. Keep the existing file list display below the drop zone unchanged

### Visual Design

```text
┌─────────────────────────────────────────┐
│                                         │
│          ↑  Upload icon                 │
│   Drag & drop files here                │
│   or click to browse                    │
│                                         │
│   PDF, JPG, PNG, DOC up to 10MB         │
│                                         │
└─────────────────────────────────────────┘
  file1.pdf  120 KB  [x]
  script.jpg  45 KB  [x]
```

### Files to Change

| File | Change |
|------|--------|
| `src/pages/doctor/DoctorNewReferral.tsx` | Replace attachment upload area with drag-and-drop zone |

