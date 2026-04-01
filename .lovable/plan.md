

## Plan: Fix Edge Function Timeout on Form Extraction

### Root Cause

The edge function times out at 90 seconds. The `gemini-2.5-pro` model is taking too long to process the PDF with the expanded prompt (digital upgrade rules, template tokens, layout hints). The logs confirm an `AbortError`.

### Fix

**File: `supabase/functions/extract-form-template/index.ts`**

Two changes:

1. **Increase timeout from 90s to 150s** — Supabase edge functions have a max wall-clock of ~150s (paid plan) or ~60s (free). The current 90s is hitting the model's thinking time. Bump to 150s to give the model enough room.

2. **Switch model to `google/gemini-2.5-flash`** — This model is significantly faster while still capable of vision + structured extraction. The pro model is overkill for form extraction and causes timeouts on multi-page PDFs. Flash handles this workload well within 60-90 seconds.

Line ~195: `setTimeout(() => controller.abort(), 90_000)` → `150_000`
Line ~209: `model: "google/gemini-2.5-pro"` → `model: "google/gemini-2.5-flash"`

### Deployment

Redeploy the `extract-form-template` edge function and test with the same PDF.

