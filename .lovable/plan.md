

## Fix: Doctor Not Redirected After Password Change

### Problem

After setting a new password on `/change-password`:
1. The `doctors.must_change_password` flag is correctly set to `false` in the database
2. `navigate("/doctor")` is called
3. But `AuthContext` still holds `mustChangePassword = true` in React state
4. `ProtectedRoute` sees the stale flag and redirects back to `/change-password`

The auth context never re-fetches the flag after the update.

### Fix

**In `ChangePassword.tsx`**: After successfully updating the password and clearing the DB flag, update the in-memory auth state so `ProtectedRoute` allows navigation through.

Two small changes:

1. **Expose a `setMustChangePassword` setter from `AuthContext`** (or a `clearMustChangePassword()` helper)
2. **Call it in `ChangePassword.tsx`** after the DB update succeeds, before navigating

### Files to Change

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Export `setMustChangePassword` or a `clearMustChangePassword` function in the context value |
| `src/pages/ChangePassword.tsx` | Call `clearMustChangePassword()` after the DB update, before `navigate("/doctor")` |

