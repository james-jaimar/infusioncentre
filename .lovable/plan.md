

## Make Course Templates CRUD obvious to Gail

### What's actually wrong

The CRUD code is fully wired (create / edit / delete / link forms all work), but **the UI hides it** behind two friction points:

1. Treatment-type cards start **collapsed** — Gail sees a list of grey cards with no obvious action.
2. The "+ Variant" button only appears **inside** an expanded card. There's no top-level "New Template" button.
3. No empty-state guidance when a treatment type has zero variants.

### What we'll change in `CourseTemplatesTab.tsx`

1. **Top-level "New Template" button** in the page header — opens the editor with type pre-empty so Gail picks the type from inside the dialog. Single discoverable entry point.
2. **Cards expanded by default** — initialize `expanded` set with all type IDs so all variants are visible immediately. Gail can collapse to declutter if she wants.
3. **Make the "+ Variant" button always visible** on the card header (not just when expanded) — so adding a Ferinject variant under "Iron Infusion" is one click from any state.
4. **Friendly empty state** inside each card with a centred "Add first variant" call-to-action when a type has no templates yet.
5. **Header pill summary** — show total template count next to title (e.g. "Course Templates · 6 variants across 3 types") so Gail knows the page works even when types are collapsed.

### What stays the same

- Database schema, hooks, mutations — all already correct
- The edit/delete/forms-linking dialog — already complete and functional
- Sidebar navigation
- Seeded templates from earlier round

### Files to touch

| File | Change |
|---|---|
| `src/components/admin/settings/CourseTemplatesTab.tsx` | Add top-level New button, default-expanded cards, always-visible variant button, empty-state CTA, header counter |

No other files affected. No DB migration. No new hooks.

