

## Plan: Compact Checkbox-Dense Sections to Match Original Layout Density

### Problem

The original PDF packs the entire SYSTEMS REVIEW (GENERAL, NERVOUS SYSTEM, PSYCHIATRIC, MUSCLE/JOINTS/BONES, EARS, EYES, SKIN, THROAT, BLOOD, KIDNEY, HEART AND LUNGS, WOMEN ONLY) onto a single page using tight 3-column checkbox grids. The current digital form renders each checkbox as a bordered card with `py-3 px-4` padding, making the form extremely long. The same issue affects PAST MEDICAL HISTORY (30 conditions in 3 columns on paper, stretched vertically in the digital form).

The nurse who designed these forms intentionally grouped things compactly. The AI needs to recognize this intent and the renderer needs a compact mode for checkbox-heavy sections.

### Solution

Two changes: a compact checkbox rendering mode in the frontend, and prompt guidance for the AI to detect and flag dense sections.

### Changes

**1. FormRenderer.tsx — Compact checkbox rendering**

Add a `density` property to `FormField` interface: `density?: "compact" | "normal"`.

When a section's fields are predominantly checkboxes (>70% checkbox type), automatically switch to compact rendering:
- Checkboxes render without borders, with reduced padding (`py-1 px-1`) — just a small checkbox + label text
- Grid layout uses 2-3 columns (`grid-cols-2 lg:grid-cols-3`) instead of pairing
- Section card inner padding reduced (`py-3 px-4` instead of `py-5 px-7`)

This auto-detection means even without the AI explicitly setting density, checkbox-heavy sections will render compactly. The AI can also explicitly set `density: "compact"` for extra control.

Implementation approach:
- In `renderGroupedFields`, before rendering a chunk, count checkbox fields vs total. If >70% are checkboxes (no conditional_on detail fields), render as a compact grid instead of using the pair-based logic
- Compact grid: `<div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">` with each checkbox being just `<label className="flex items-center gap-2 py-1 text-sm">...</label>`
- Non-checkbox fields within the section (like "Where?" text input) still render normally below the grid

**2. Extract prompt — Layout density analysis**

Add to the LAYOUT & UX RULES in the system prompt:

```
- LAYOUT DENSITY: Analyse how the original document uses space. When checkbox 
  lists are packed tightly in multi-column layouts on the source document, add 
  "density": "compact" to each checkbox field in those sections. This tells the 
  renderer to use a tight grid layout matching the original's space efficiency. 
  Apply this to sections like medical history checklists and systems review 
  where the original clearly prioritises density.
```

Add `density` to the tool schema field properties:
```json
"density": {
  "type": "string",
  "enum": ["compact", "normal"],
  "description": "Render density. 'compact' for tight checkbox grids matching dense paper layouts."
}
```

**3. FormRenderer.tsx — Section padding awareness**

When all fields in a section are compact checkboxes, reduce the section card's inner padding from `px-5 sm:px-7 py-5 sm:py-6` to `px-4 sm:px-5 py-3 sm:py-4`.

### Technical Detail

Auto-detection logic (no AI dependency needed for existing forms):

```typescript
const isCompactSection = (fields: FormField[]) => {
  const visible = fields.filter(f => isFieldVisible(f));
  const checkboxCount = visible.filter(f => 
    f.field_type === "checkbox" && !f.conditional_on
  ).length;
  return visible.length >= 4 && checkboxCount / visible.length >= 0.7;
};
```

Compact checkbox rendering:

```typescript
// Instead of bordered cards with py-3 px-4:
<label className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:text-foreground text-muted-foreground">
  <Checkbox checked={!!val} onCheckedChange={...} className="h-3.5 w-3.5" />
  <span className="leading-snug">{field.label}</span>
</label>
```

Visual comparison:

```text
Current (each checkbox ~44px tall with borders):
┌─────────────────────────────┐
│ ☐ Recent weight gain        │   44px
└─────────────────────────────┘
┌─────────────────────────────┐
│ ☐ Recent weight loss        │   44px
└─────────────────────────────┘

Compact (each checkbox ~28px, 3-col grid):
☐ Recent weight gain    ☐ Headaches          ☐ Depression
☐ Recent weight loss    ☐ Dizziness          ☐ Excessive worries
☐ Fatigue               ☐ Fainting           ☐ Difficulty falling asleep
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/forms/FormRenderer.tsx` | Add `density` to interface, auto-detect compact sections, render compact checkbox grid |
| `supabase/functions/extract-form-template/index.ts` | Add LAYOUT DENSITY rule and `density` to tool schema |
| Redeploy edge function | Required |

### Re-import Required

After deployment, re-upload the PDF to get fresh extraction with density hints. However, the auto-detection in the renderer means even existing schemas will benefit from the compact layout immediately for checkbox-heavy sections.

