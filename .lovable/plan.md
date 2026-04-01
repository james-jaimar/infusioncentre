

## Plan: Smart Yes/No Column Detection in Condition Tables

### Problem

The document has a table of conditions (Asthma, Eczema, etc.) with "Yes" and "Details" columns. The "Yes" column header is just a label — the paper form expects a tick or checkmark — but the current rendering shows it as a plain text input because the `SubstanceTable` component only recognises "Currently still use" as a Yes/No dropdown column.

Two fixes needed:

### Changes

**1. Update `SubstanceTable` component** (`src/components/forms/SubstanceTable.tsx`)

Change the Yes/No column detection from a hardcoded string match (`col === "Currently still use"`) to a pattern match that also catches columns like "Yes", "Yes/No", "Y/N":

```typescript
const isYesNoColumn = (col: string) =>
  /^(yes\/?no?|y\/?n|currently still use)$/i.test(col.trim());
```

Use `isYesNoColumn(col)` instead of `col === "Currently still use"` on line 40.

**2. Strengthen extraction prompt** (`supabase/functions/extract-form-template/index.ts`)

Update line 49 to be more explicit about recognising these patterns:

```
- CONDITION/CHECKLIST TABLES: When the document has a table listing conditions, symptoms, or items with columns for Yes/tick/check and Details/comments, use "substance_table" with rows = the condition names and columns = ["Yes/No", "Details"]. This applies even if the original column header just says "Yes" or uses checkboxes/tick boxes — normalise the column name to "Yes/No". Look for ANY tabular layout where rows are conditions/items and columns collect a boolean answer plus optional free-text details.
```

### Result

The SubstanceTable will render a proper Yes/No dropdown for any column matching the pattern, and the AI will more reliably detect these table structures from poorly designed paper forms.

