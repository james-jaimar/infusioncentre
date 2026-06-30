## Admin Dashboard layout tweaks

File: `src/pages/admin/AdminDashboard.tsx`

1. **Remove Contact Submissions stat card** from the 4-up stat grid (the grid becomes 3 cards: Patients, Active Courses, Appointments). Adjust grid to `md:grid-cols-3`.
2. **Remove "View Contact Submissions" Quick Action card**, leaving Manage Patients and View Schedule (grid becomes `md:grid-cols-2`).
3. **Move "Today's Appointments"** out of the bottom two-column grid and render it as a full-width section directly under the Patient Pipeline panel (above the stat cards).
4. **Keep "Active Patients"** where it is, but as a single full-width section (no longer paired in a 2-col grid).

No business logic, hook, or data-fetching changes — purely presentational reordering/removal.