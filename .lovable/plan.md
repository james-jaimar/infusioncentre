

## Plan: Post-Process Date Field Consolidation

### Problem

The AI model ignores the prompt instruction to consolidate date fields. It keeps creating "Agreement effective date", "Date signed", "Dated at" as separate fields. Prompt engineering alone cannot reliably fix this.

### Solution

Add a **server-side post-processing step** after extraction that programmatically collapses all date-like fields into a single canonical `date` field and rewrites any `{{field_name}}` references in info_text blocks to point to it.

### Changes

**File: `supabase/functions/extract-form-template/index.ts`**

Add a `consolidateDateFields` function before the `serve()` call that:
1. Finds all fields where `field_type === "date"` or the label/field_name matches date-related patterns (agreement date, dated at, date signed, effective date)
2. If more than one is found, keeps the one nearest the signature (or the last one) as canonical with `field_name: "date"` and `label: "Date"`
3. Removes the redundant date fields from the schema
4. Rewrites any `{{old_field_name}}` tokens in info_text content to `{{date}}`

Call this function on line 285, right after `extracted = JSON.parse(toolArgsRaw)`:
```typescript
consolidateDateFields(extracted);
```

This guarantees exactly one date field regardless of what the AI produces.

### Technical Detail

```typescript
function consolidateDateFields(extracted: any) {
  const fields = extracted?.form_schema;
  if (!Array.isArray(fields)) return;

  const datePattern = /\b(date|dated|effective.date|agreement.date|date.signed)\b/i;
  const dateIndices: number[] = [];

  fields.forEach((f: any, i: number) => {
    if (f.field_type === "date" || datePattern.test(`${f.field_name} ${f.label}`)) {
      dateIndices.push(i);
    }
  });

  if (dateIndices.length <= 1) return;

  // Keep the last date field (nearest signature), rename to canonical
  const keepIdx = dateIndices[dateIndices.length - 1];
  const dropNames = new Set<string>();

  dateIndices.forEach((idx) => {
    if (idx !== keepIdx) dropNames.add(fields[idx].field_name);
  });

  fields[keepIdx].field_name = "date";
  fields[keepIdx].label = "Date";
  if (fields[keepIdx].layout_hint === "inline") delete fields[keepIdx].layout_hint;

  // Remove redundant fields
  extracted.form_schema = fields.filter((_: any, i: number) =>
    !dateIndices.includes(i) || i === keepIdx
  );

  // Rewrite {{tokens}} in info_text
  extracted.form_schema.forEach((f: any) => {
    if (f.field_type === "info_text" && f.content) {
      for (const name of dropNames) {
        f.content = f.content.replaceAll(`{{${name}}}`, "{{date}}");
      }
    }
  });
}
```

### Deployment

Redeploy the `extract-form-template` edge function. Re-import the PDF to get a clean single-date extraction.

