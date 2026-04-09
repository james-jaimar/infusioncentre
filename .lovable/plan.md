

## Plan: Fix Calendar Dropdown Styling (Correct Approach)

### Root Cause
In react-day-picker v8, each dropdown renders three elements:
1. A `<span class="vhidden">` -- accessibility label ("Month:", "Year:")
2. A `<select class="dropdown">` -- the actual select, styled with **opacity: 0** so it's invisible but clickable
3. A `<div class="caption_label">` -- the visible text display ("April", "2026") + a dropdown icon

The library's design: the invisible select overlays the visible caption_label. Clicking the caption_label area actually clicks the transparent select, opening the native picker.

Our previous fix broke this by giving `dropdown` visible styles (`bg-background border border-input`), making the select visible. Now BOTH the select text AND the caption_label text render, creating duplicate/overlapping text.

### Solution
Style the elements according to how react-day-picker v8 actually works:

**File: `src/components/ui/calendar.tsx`**

| classNames key | New value | Why |
|---|---|---|
| `caption_dropdowns` | `flex items-center gap-4` | Side-by-side month/year, with breathing room |
| `dropdown_month` | `relative inline-flex items-center` | Container for each dropdown pair |
| `dropdown_year` | `relative inline-flex items-center` | Same |
| `dropdown` | `absolute inset-0 w-full opacity-0 cursor-pointer z-10` | Invisible select on top, clickable |
| `caption_label` | `text-sm font-medium inline-flex items-center gap-1 border border-input rounded-md px-2 py-1 bg-background` | The visible styled element users see |
| `dropdown_icon` | `w-3 h-3 opacity-50` | Small chevron indicator |
| `vhidden` | `hidden` | Hide accessibility labels (they break layout) |

The select stays invisible. The `caption_label` becomes the styled "button-like" element. Clicking it triggers the native select dropdown. Clean, standard pattern.

### Result
Month and year show as two clean, bordered pill-style selectors side by side. Clicking either opens a native dropdown. No duplicate text, no layout mess.

### Files Changed

| File | Change |
|------|--------|
| `src/components/ui/calendar.tsx` | Fix dropdown/caption_label/vhidden classNames to match rdp v8's rendering model |

