## Goal

Let Gail (and any admin) see at a glance when new referrals arrive — without having to click into the Referrals page. Mirror the existing red-badge pattern already used for unread Messages in the sidebar, plus surface the count on the Dashboard.

## What changes for the user

1. **Sidebar "Referrals" item** gets a red pill badge showing the number of *pending* (un-triaged) referrals — same style as the Messages badge.
2. **Admin Dashboard** gets a small "New Referrals" alert card at the top when count > 0, with a one-click "Review queue" link.
3. Counts update in **real time** (via Supabase Realtime on the `referrals` table) and also poll every 30s as a fallback — same pattern as `useUnreadMessageCount`.
4. Optional toast (sonner) "New referral received from Dr. X" when the admin is logged in and a row is inserted, so it's noticed even mid-task.

## What counts as "new"

- `referrals.status = 'pending'` (the un-triaged queue). This matches the existing "Pending Triage" metric already shown on the Referral Queue page.
- Once Gail opens the triage dialog and moves status off `pending` (under_review / accepted / rejected), the badge decrements automatically.

## Technical changes

**New hook — `src/hooks/usePendingReferralsCount.ts`**
- Modeled directly on `src/hooks/useUnreadMessages.ts`.
- `useQuery` with `select('*', { count: 'exact', head: true }).eq('status', 'pending')` against `referrals`.
- `refetchInterval: 30_000`.
- Subscribe to a Supabase channel `pending-referrals-count` listening to `postgres_changes` (event `*`, table `referrals`); on any event call `query.refetch()`.
- Optional: in the INSERT handler, fire a `toast.info('New referral received')` (guarded so it doesn't fire on the user's own initial fetch).

**`src/components/layout/AdminLayout.tsx`**
- Import the new hook alongside `useUnreadMessageCount`.
- Add `const pendingReferrals = usePendingReferralsCount();`.
- Extend the badge condition in the nav `.map(...)` so `item.name === "Referrals" && pendingReferrals > 0` renders the same red pill (extract a tiny `<NavBadge count={n} />` helper to keep JSX clean).

**`src/pages/admin/AdminDashboard.tsx`**
- Add a compact alert card near the top: "X new referral(s) awaiting triage" with a `Link to="/admin/referrals?status=pending"` styled as a button. Hidden when count is 0.
- Reuse the same hook so it shares the cache (no extra query).

**Filter prefill (small touch)**
- `AdminReferrals.tsx` reads `?status=pending` from the URL on mount and seeds `statusFilter` so the dashboard link lands on a filtered view.

## Out of scope

- Browser push notifications / sound alerts (can be added later if desired).
- Per-user "seen" tracking — the badge reflects queue state, not personal read state, which matches how a triage queue typically works and avoids extra schema.
- Doctor-side and nurse-side notification surfaces (this request is about Gail / admin only).

## Files touched

- `src/hooks/usePendingReferralsCount.ts` *(new)*
- `src/components/layout/AdminLayout.tsx` *(badge + small NavBadge helper)*
- `src/pages/admin/AdminDashboard.tsx` *(alert card)*
- `src/pages/admin/AdminReferrals.tsx` *(read `?status=` query param)*

No DB migrations, no edge functions, no new dependencies.