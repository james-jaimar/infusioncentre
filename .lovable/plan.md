

## Plan: Fix Tab-Switch Page Reload

### Root cause

In `AuthContext.tsx` (line 46-63), the `onAuthStateChange` listener fires whenever you return to the tab (Supabase re-validates the session token). The handler sets `loading = true` (line 53), which causes `ProtectedRoute` to unmount all children and show a full-screen spinner. When the data re-fetches and `loading` goes back to `false`, everything remounts from scratch — losing form state, scroll position, etc.

### Fix

1. **`src/contexts/AuthContext.tsx`** — Track whether initial load is complete with a ref (`initialLoadDone`). Only set `loading = true` during the very first session check. On subsequent `onAuthStateChange` events, silently refresh profile/role data in the background without touching `loading`.

2. **`src/App.tsx`** — Set `refetchOnWindowFocus: false` on the global `QueryClient` to prevent React Query from also refetching all queries on tab focus (this causes additional unnecessary network churn).

### What this changes

- No more spinner when switching tabs — the page stays exactly as you left it
- Auth token is still silently validated in the background
- Form data, scroll position, and UI state are preserved
- Initial page load still shows the spinner (correct behavior)

### Files touched

- `src/contexts/AuthContext.tsx` — add `initialLoadDone` ref, skip `setLoading(true)` after first load
- `src/App.tsx` — add `defaultOptions: { queries: { refetchOnWindowFocus: false } }` to QueryClient

