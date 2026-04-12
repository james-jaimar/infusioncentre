

## Plan: Update Form Notification Email Recipient

Change the `GAYLE_EMAIL` constant in the `submit-public-form` Edge Function from the test address (`hello@jaimar.dev`) back to Gail's production email (`gayle@infusioncentre.co.za`).

### What changes

**File:** `supabase/functions/submit-public-form/index.ts`
- Line 10: Change `const GAYLE_EMAIL = "hello@jaimar.dev"` to `const GAYLE_EMAIL = "gayle@infusioncentre.co.za"`

Then redeploy the `submit-public-form` Edge Function so the change takes effect.

