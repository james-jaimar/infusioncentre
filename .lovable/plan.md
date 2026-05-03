## Problem

The password reset email links point to `https://infusioncentre.lovable.app` instead of your primary custom domain `https://infusioncentre.jmar.dev`.

**Root cause:** `supabase/functions/password-reset/index.ts` has the URL hardcoded:

```ts
const SITE_URL = "https://infusioncentre.lovable.app";
```

Every reset link is built as `${SITE_URL}/reset-password?token=...`, so it always points to the lovable.app preview/published URL regardless of which domain the user actually came from.

## Fix

Make the link use the request's own origin (with the hardcoded value as a fallback), so a reset triggered from `infusioncentre.jmar.dev` produces a `jmar.dev` link, and one triggered from the lovable.app URL produces a lovable.app link.

### Changes in `supabase/functions/password-reset/index.ts`

1. Remove the hardcoded `SITE_URL` constant.
2. At the top of the `Deno.serve` handler, derive the site URL per request:
   - Prefer the `origin` header (the browser sends this on `fetch`/`supabase.functions.invoke`).
   - Fall back to `referer` header's origin.
   - Final fallback: `https://infusioncentre.jmar.dev` (your primary published domain).
   - Strip any trailing slash.
3. Pass that resolved `siteUrl` into both places that currently use `SITE_URL`:
   - `request` action → `resetLink = ${siteUrl}/reset-password?token=${token}`
   - `admin-reset-email` action → same.

No changes needed to the email HTML, token logic, validation, or DB schema.

### Why per-request origin (not a Supabase secret)

A secret like `APP_URL` would also work, but it locks every email to one domain. Using the request origin means:
- Resets initiated from the published custom domain link to the custom domain.
- Resets initiated from the preview/staging URL link to that environment.
- No env var to manage when you add or change domains later.

The hardcoded fallback covers edge cases where origin/referer aren't present (e.g. server-to-server calls).

## Files to edit

- `supabase/functions/password-reset/index.ts`

## Out of scope

- No DB changes.
- No changes to `ResetPassword.tsx` page or token format.
- No changes to other edge functions (none of the others build user-facing links with a hardcoded host that I can see, but I'll confirm during implementation and flag if any do).