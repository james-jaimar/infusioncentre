

## Plan: Wire Up Facsimile Rendering in Preview and Editor

### Problem
The preview and editor always render the old schema-based form because neither passes `renderMode` nor `slug` from the template to `FullScreenFormDialog`. The facsimile component exists but is never invoked.

### Changes

**File: `src/pages/admin/AdminFormTemplates.tsx`**

1. Add `renderMode` and `slug` props to the `FullScreenFormDialog` preview call (~line 397):
```tsx
<FullScreenFormDialog
  ...
  renderMode={previewTemplate?.render_mode as any}
  slug={previewTemplate?.slug || undefined}
/>
```

This single change means when a template has `render_mode: "facsimile"` and `slug: "monofer-motivation"`, the preview dialog will look up the slug in the facsimile registry and render the custom MonoferMotivationForm component instead of the generic schema renderer.

### Result
Clicking the preview (eye icon) on the Monofer form will show the pixel-perfect facsimile layout instead of the generic schema view.

