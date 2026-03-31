

## Plan: Fix Intermittent Edge Function Timeout/CORS Failures

### Root Cause

The `extract-form-template` edge function occasionally times out or crashes when processing large PDFs through the AI gateway. When this happens, Supabase returns a raw error response without the function's CORS headers, causing the browser to report a CORS error. The actual problem is not CORS configuration — it's the function failing to respond.

### Fixes

**1. Add a fetch timeout to the AI gateway call** (`extract-form-template/index.ts`)

The AI gateway call for a 187KB PDF can take 30-60+ seconds. Add an `AbortController` with a generous timeout (90s) so the function fails gracefully with a proper error + CORS headers instead of Supabase killing it silently.

**2. Add retry logic on the client side** (`AIImportDialog.tsx`)

If the function call fails with a network error (FunctionsFetchError), retry once automatically before showing an error. This handles transient gateway timeouts.

**3. Better error messaging**

Show the user a clearer message like "The AI is taking too long to process this document. Please try again." instead of "Failed to send a request to the Edge Function."

### Files

| File | Change |
|------|--------|
| `supabase/functions/extract-form-template/index.ts` | Add AbortController timeout (90s) to the AI gateway fetch; wrap outer handler to guarantee CORS headers on all error paths |
| `src/components/forms/AIImportDialog.tsx` | Add single retry on network failure; improve error message for timeout/network errors |

### Technical Detail

The edge function will wrap the entire handler in a top-level try/catch that always returns CORS headers, and use `AbortSignal.timeout(90000)` on the AI gateway fetch so it aborts cleanly rather than letting Supabase kill the function without CORS.

