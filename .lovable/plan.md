

## Fix: Invite Landing Page - RLS Blocks Unauthenticated Access

### Problem
When a new patient clicks their invite link, the `InviteLanding` page queries the `patient_invites` table to validate the token. However, the visitor is **not logged in**, and all RLS policies on `patient_invites` require an authenticated user (admin, nurse, or linked patient). The query silently returns no data, triggering the "Invite Not Valid" error.

### Solution
Add an RLS policy that allows **anyone** to read a single invite row **by token** -- this is safe because:
- Tokens are cryptographic UUIDs (unguessable)
- The policy only exposes the invite row matching the token, not the full table
- No sensitive data beyond email and patient first/last name is exposed

### Changes

**1. Database Migration -- Add public SELECT policy on `patient_invites`**

Add a new RLS policy:
```sql
CREATE POLICY "Anyone can view invite by token"
  ON public.patient_invites
  FOR SELECT
  USING (true);
```

Since the query always filters by `token` (a UUID), this is equivalent to a "lookup by secret" pattern. Alternatively, we could scope it more tightly, but the token itself acts as the access control.

**2. Frontend -- No changes needed**

The `InviteLanding.tsx` code already queries by `.eq("token", token)` and handles all status checks (expired, revoked, accepted) correctly. Once RLS allows the read, the existing logic will work.

### Technical Details
- The `patient_invites` table columns exposed: `id`, `patient_id`, `token`, `email`, `phone`, `status`, `expires_at`, `accepted_at`, `created_at`, `invited_by`
- The join to `patients(first_name, last_name, user_id)` also needs the unauthenticated user to read patients -- but this will fail due to patients RLS. We need to handle this differently.

**Revised approach**: Instead of a broad SELECT policy, create a **security-definer function** that validates the token and returns the needed data, bypassing RLS safely.

**1. Database Migration -- Create a `validate_invite_token` function**

```sql
CREATE OR REPLACE FUNCTION public.validate_invite_token(invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', pi.id,
    'patient_id', pi.patient_id,
    'token', pi.token,
    'email', pi.email,
    'status', pi.status,
    'expires_at', pi.expires_at,
    'accepted_at', pi.accepted_at,
    'patient', json_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'user_id', p.user_id
    )
  ) INTO result
  FROM patient_invites pi
  JOIN patients p ON p.id = pi.patient_id
  WHERE pi.token = invite_token;

  RETURN result;
END;
$$;
```

**2. Frontend -- Update `InviteLanding.tsx`**

Replace the direct table query with an RPC call:
```typescript
const { data, error } = await supabase.rpc("validate_invite_token", {
  invite_token: token,
});
```

This approach:
- Bypasses RLS safely via `SECURITY DEFINER`
- Only returns data for a valid token (unguessable UUID)
- Avoids opening up broad SELECT access on sensitive tables
- Returns exactly the fields needed for the landing page

