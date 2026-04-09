

## Plan: Fix Signature Box Spacing in Monofer Facsimile Form

### Problem
The signature boxes are cramped because the `SignatureCanvas` component has its own label, dashed borders, padding, and a fixed `h-32` canvas height — but in the facsimile form, each signature is wrapped in a tiny `h-14` or `h-16` container. This causes clipping and visual breakage.

### Solution
Two changes:

**File: `src/components/forms/facsimile/MonoferMotivationForm.tsx`**

1. Remove the tight `h-14`/`h-16` wrapper divs around each `<Sig>` call — let the SignatureCanvas render at its natural height
2. Give each signature area proper spacing with adequate height (`min-h-[140px]`) so the canvas, label, hint text, and clear button all fit comfortably
3. Applies to all 5 signature locations:
   - Patient signature (line ~140)
   - Nurse signature (line ~163)
   - HCP signature (line ~185)
   - Acino/undertaking signature (line ~201)
   - Dr motivation signature (line ~370)

**File: `src/components/forms/SignatureCanvas.tsx`** (minor)

4. When used inside the facsimile context, the component's own outer `space-y-2` and label are redundant since the facsimile already provides its own label. Add an optional `compact` prop that hides the built-in label and reduces outer padding, so it fits cleanly inside the facsimile layout without double-labeling or wasted space.

### Result
Signature boxes will have proper room to draw, the form will extend naturally to accommodate them, and the overall facsimile layout stays clean and document-like.

### Files Changed

| File | Change |
|------|--------|
| `src/components/forms/facsimile/MonoferMotivationForm.tsx` | Remove constrained height wrappers on all 5 signature areas; give them breathing room |
| `src/components/forms/SignatureCanvas.tsx` | Add optional `compact` prop to hide built-in label and reduce padding for facsimile use |

