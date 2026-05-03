## Problem

After creating sessions via the "Schedule sessions" flow on the Referrals page, the referral row still shows the amber **"Needs session scheduling"** badge and the "Incomplete Workflow" metric stays at 1. Refreshing the page clears it, so the data is correct — only the cache is stale.

## Root cause

`useCreateBulkAppointments` (in `src/hooks/useAppointments.ts`) only invalidates two query keys after inserting appointments:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["appointments"] });
  queryClient.invalidateQueries({ queryKey: ["treatment-courses"] });
}
```

The Referrals page derives its attention state from the `["referrals"]` query (which embeds `treatment_courses → appointments`) and the `["referrals-attention-count"]` query. Neither is invalidated, so the table keeps showing the pre-insert appointment count of 0.

The realtime subscription in `useReferralsAttentionCount` listens for `appointments` changes, but Postgres realtime isn't enabled for that table in this project, so the channel never fires for appointment inserts. (Treatment-course inserts do fire — that's why the row correctly switched from "Needs course" → "Needs scheduling" earlier.)

## Fix

Two small, surgical changes:

### 1. `src/hooks/useAppointments.ts` — broaden cache invalidation

Add referral-related query invalidations to `useCreateBulkAppointments` (and, for consistency, to `useCreateAppointment`, `useRescheduleAppointment`, `useCancelAppointment` / status updates if present):

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["appointments"] });
  queryClient.invalidateQueries({ queryKey: ["treatment-courses"] });
  queryClient.invalidateQueries({ queryKey: ["referrals"] });
  queryClient.invalidateQueries({ queryKey: ["referrals-attention-count"] });
}
```

This is the authoritative fix — it doesn't depend on realtime being configured.

### 2. `src/components/admin/RecurringSessionDialog.tsx` — belt-and-braces

In `handleSubmit`, after `await createBulk.mutateAsync(...)` succeeds, the dialog already calls `onCreated?.()`. No code change needed there once #1 is in place. The existing `onCreated` callback in `AdminReferrals.tsx` (`() => setSchedulingReferral(null)`) will close the scheduler, and the freshly-invalidated `useReferrals` query will repaint the row as "Complete" with no badge.

### Optional polish

- After successful bulk creation, also fire a brief `toast.success("Referral workflow complete")` when the referral now has all its sessions scheduled — reinforces the "task closed" feedback the user wanted.

## Files to edit

- `src/hooks/useAppointments.ts` — add 2 invalidations to bulk + single create + reschedule mutations.

## Verification

1. Convert a referral → schedule sessions via the dialog → click Create appointments.
2. The dialog closes, the row's amber tint and "Needs session scheduling" badge disappear immediately, the action button becomes "View", and the **Incomplete Workflow** metric drops to 0 — without a page refresh.
