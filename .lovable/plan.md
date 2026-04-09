

## Plan: Fix Calendar Year/Month Dropdown Styling

### Problem
The Calendar component uses `react-day-picker` v8's `captionLayout="dropdown-buttons"` feature, but the `classNames` object in `calendar.tsx` has zero styles for the dropdown elements. The dropdowns render with browser-default `<select>` styling, stacked awkwardly, producing the mess visible in the screenshot.

### Solution
Add proper Tailwind classes for the dropdown elements to `src/components/ui/calendar.tsx`. This is a single-file fix.

### Changes

**File: `src/components/ui/calendar.tsx`**

Add these classNames to the existing `classNames` object:

| Key | Style | Purpose |
|-----|-------|---------|
| `caption` | Update to `flex justify-center pt-1 relative items-center gap-1` | Add gap for dropdowns |
| `caption_label` | `hidden` when dropdowns present (handled by DayPicker automatically) | Hides label when using dropdown layout |
| `caption_dropdowns` | `flex items-center gap-2` | Side-by-side month/year dropdowns |
| `dropdown` | Styled select: rounded border, small text, padding, background | Clean dropdown appearance |
| `dropdown_month` | `relative` | Positioning |
| `dropdown_year` | `relative` | Positioning |
| `vhidden` | `hidden` | Hide the visually-hidden accessibility labels that DayPicker adds (they cause layout issues) |

The dropdown `<select>` elements will get compact, clean styling matching the rest of the UI -- proper border, rounded corners, consistent font size. Month and year sit side-by-side in one row.

### Result
All date pickers across the app (facsimile and schema-based) will show clean, properly styled month and year dropdowns. Users can jump to any year instantly. One file changed, zero logic changes.

### Files Changed

| File | Change |
|------|--------|
| `src/components/ui/calendar.tsx` | Add dropdown-related classNames for styled month/year selectors |

