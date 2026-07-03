## Goal

Add a new **Appearance** tab in Admin → Settings where admins can customize the standard UI colors (buttons, links, backgrounds, borders, state colors) with a live preview, saved per tenant and applied globally at runtime via CSS variables.

## Where it plugs in

- New tab in `src/pages/admin/AdminSettings.tsx` between **Clinic** and **Chairs**: "Appearance".
- New component `src/components/admin/settings/AppearanceSettingsTab.tsx`.
- Reuses the existing tenant branding pipeline in `src/contexts/TenantContext.tsx` (already writes CSS vars on `:root` from the `tenants` row) — we extend it to cover more tokens.

## Editable tokens (industry-standard set)

Grouped for clarity, each rendered as a color-picker + hex input (like `TenantForm.tsx`), with a "Reset to default" per token:

**Brand**
- Primary (buttons, active states) → `--primary`
- Primary foreground (text on primary) → `--primary-foreground`
- Accent (secondary CTAs, highlights) → `--accent`
- Link color (anchor tags) → new `--link` token

**Surfaces**
- Page background → `--background`
- Card / panel background → `--card`
- Muted surface → `--muted`
- Border / divider → `--border`
- Ring (focus outline) → `--ring`

**Text**
- Foreground (body text) → `--foreground`
- Muted foreground → `--muted-foreground`

**State**
- Success → `--state-success`
- Warning → `--state-warning`
- Danger / destructive → `--destructive` (and mirrors to `--state-danger`)
- Info → `--state-info`

Sidebar colors stay on the tenant's primary derivation (not user-editable in v1) to keep the nav coherent.

## Storage

Extend the existing `tenants` row rather than adding a new table — branding is already tenant-scoped there. Add a JSONB column `theme_tokens` on `public.tenants` shaped like:

```json
{
  "primary": "#1F3A5F",
  "primary_foreground": "#FFFFFF",
  "accent": "#1F3A5F",
  "link": "#356DA8",
  "background": "#E4E9EE",
  "card": "#FFFFFF",
  "muted": "#EDF0F3",
  "border": "#C4CDD6",
  "ring": "#1F3A5F",
  "foreground": "#2E3E52",
  "muted_foreground": "#6B7C8F",
  "success": "#2E7D61",
  "warning": "#C48A2D",
  "danger": "#A23B3B",
  "info": "#356DA8"
}
```

Nullable — when null, the app falls back to the CSS defaults in `src/index.css`. Only admins can update (`has_role(auth.uid(),'admin')` policy on `tenants` already exists).

## Runtime application

Extend `TenantContext.tsx` so its existing `useEffect` also iterates `tenant.theme_tokens` and writes each entry to `:root` as the matching HSL variable. We convert stored hex → HSL string (`H S% L%`) in a small helper `src/lib/colorTokens.ts` so it slots straight into the existing `hsl(var(--x))` consumers — no component changes needed.

`--link` gets applied through a small global rule in `src/index.css`:

```css
a { color: hsl(var(--link, var(--primary))); }
```

so anchors follow the token when set and fall back to primary.

## UI (AppearanceSettingsTab)

```text
┌─ Appearance ───────────────────────────────┐
│ [Reset all to defaults]     [Save changes] │
│                                            │
│  Brand         Surfaces      Text   State  │  (cards side by side, wrap)
│  ┌──────────┐ ┌──────────┐  ┌────┐ ┌────┐  │
│  │ swatches │ │ swatches │  │... │ │... │  │
│  └──────────┘ └──────────┘  └────┘ └────┘  │
│                                            │
│  ── Live preview ──                        │
│  Sample button / link / card / alert       │
│  rendered inline so admins see the effect  │
│  before saving.                            │
└────────────────────────────────────────────┘
```

Each token: `<input type="color">` + hex text input + small "reset" ghost button. Preview panel re-renders using local (unsaved) values injected as inline `style="--primary: ...; ..."` on the preview container.

## Technical details

1. **Migration** (`ALTER TABLE public.tenants ADD COLUMN theme_tokens jsonb;`). No new table so no new GRANTs needed.
2. **`src/lib/colorTokens.ts`** — `hexToHslString(hex)` and `DEFAULT_TOKENS` map (mirrors `index.css` defaults) plus a `TOKEN_GROUPS` metadata array driving the UI.
3. **`src/contexts/TenantContext.tsx`** — after fetching tenant, walk `theme_tokens` and `root.style.setProperty('--<name>', hexToHslString(value))`; clean up on unmount. Update `Tenant` type to include `theme_tokens`.
4. **`src/hooks/useTenantAdmin.ts`** — add `useUpdateTenantTheme({ tenantId, tokens })` mutation writing to `tenants.theme_tokens` and invalidating the `["tenant", tenantId]` query so the change applies immediately.
5. **`src/components/admin/settings/AppearanceSettingsTab.tsx`** — new component; reads current tokens from `useTenant()`, local edit state, live preview panel, save + reset-all.
6. **`src/pages/admin/AdminSettings.tsx`** — new `<TabsTrigger value="appearance">Appearance</TabsTrigger>` and matching `<TabsContent>`.
7. **`src/index.css`** — add `a { color: hsl(var(--link, var(--primary))); }` (scoped to app content, not the sidebar which sets its own text color) and declare `--link` default.

## Out of scope for this pass

- Typography / font picker
- Per-role themes
- Sidebar color customization
- Import/export theme presets (can add later once the token set is stable)

Let me know if you'd like typography or preset themes included in this pass, otherwise I'll build exactly the above.