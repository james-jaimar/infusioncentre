

## Plan: Fix Public Form — Correct Branding + Fully Responsive Layout

### Problems

1. **Wrong name** — Header says "D.I.S Infusion Centre" instead of "Johannesburg Infusion Centre"
2. **No logo** — Uses a Lucide icon instead of the actual logo at `src/assets/logo.png`
3. **Too narrow** — `max-w-5xl` (1024px) still wastes space; should use ~90% of viewport

### Changes

**File: `src/pages/PublicForm.tsx`**

1. **Import the real logo** — `import logo from "@/assets/logo.png"` and display it in the header, same as the main site Header component does
2. **Fix clinic name** — Change "D.I.S Infusion Centre" to "Johannesburg Infusion Centre"
3. **Remove fixed max-width** — Replace `max-w-5xl` with `w-[90%] max-w-[1600px]` on the header inner div and main content area so it uses ~90% of viewport on any screen size, capping at 1600px for ultra-wide monitors
4. **Remove the Syringe icon** — Replace with the actual `<img src={logo}>` element
5. **Responsive form grid** — The FormRenderer already uses `sm:grid-cols-2` which will naturally fill the wider container. The identity fields grid stays the same pattern.

### Technical Detail

Single file change: `src/pages/PublicForm.tsx`. Remove the `Syringe` import, add the logo import, update all container widths and the header text. Everything else (FormRenderer, submit logic, DB save) stays unchanged.

