

## Plan: Fix Extract Form Template Edge Function Error

### Problem

The edge function `extract-form-template` is crashing with `SyntaxError: Unexpected end of JSON input`. This happens when parsing the AI gateway response — for large/complex PDFs, the response body can be truncated or incomplete, causing `response.json()` to fail.

### Fix

**File: `supabase/functions/extract-form-template/index.ts`**

1. Replace `response.json()` with `response.text()` first, then `JSON.parse()` wrapped in a try/catch — this gives a readable error message instead of a cryptic crash
2. Add the same safety for `JSON.parse(toolCall.function.arguments)` since large tool call arguments can also be truncated
3. Add a timeout and response size guard log so we can diagnose future issues

### Specific Changes

Around line 239:
```typescript
// Before:
const result = await response.json();

// After:
const responseText = await response.text();
let result;
try {
  result = JSON.parse(responseText);
} catch (parseErr) {
  console.error("Failed to parse AI response. Length:", responseText.length, "First 500 chars:", responseText.substring(0, 500));
  throw new Error("AI returned an invalid response. The document may be too complex — try a simpler or shorter PDF.");
}
```

Around line 246, same pattern for the tool call arguments parse.

### Deployment

Redeploy the `extract-form-template` edge function after the fix.

