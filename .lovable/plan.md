

## Plan: Fix Modal Persistence + Extend Session Timeout to 4 Hours

### 1. Extend session timeout to 4 hours

**File:** `src/hooks/useSessionTimeout.ts`

Change line 4:
```typescript
const TIMEOUT_DURATION = 4 * 60 * 60 * 1000; // 4 hours
```

Update the warning message in `src/components/SessionTimeoutWarning.tsx` accordingly.

### 2. Prevent modals from closing on tab-switch / visibility change

The `FullScreenFormDialog` (and likely other dialogs) loses state when the browser tab loses focus because the activity-based session timeout fires `resetTimers` on every interaction, and the `useEffect` cleanup in the dialog may re-render on visibility changes.

The real issue: the `mousemove`, `scroll`, etc. event listeners in `useSessionTimeout` cause frequent re-renders via `resetTimers` changing state. When the user switches tabs and comes back, React may remount components.

**Fix approach -- debounce activity resets:**
- In `useSessionTimeout.ts`, debounce `resetTimers` so it only fires at most once every 30 seconds instead of on every single mouse move. This eliminates unnecessary re-render pressure.

**File:** `src/hooks/useSessionTimeout.ts`
- Add a debounce guard: only call `resetTimers()` if more than 30 seconds have passed since last reset.

### Files touched
- `src/hooks/useSessionTimeout.ts` -- timeout to 4 hours + debounce activity handler
- `src/components/SessionTimeoutWarning.tsx` -- update warning text if needed

