

## Plan: Add AI Reasoning Output and Fix Extraction Prompt for Remaining Issues

### Problem Analysis

Comparing the five screenshots against the original PDF (page by page), I've identified these issues — all are **extraction prompt failures**, not renderer bugs:

### Issue 1: "List three things..." (Image 50)
**What's wrong**: The question text "List three things you struggle with currently and hope to be able to do after therapy?" appears to be rendering as an unlabelled textarea instead of an info_text label. The numbered fields (1, 2, 3) are rendering correctly side-by-side, but there's a stray empty text box between the textarea and the numbered list.
**Root cause**: The AI likely merged the question with the textarea for "What are your treatment goals?" or created an extra empty field. The NUMBERED LIST rule says to create a separate info_text, but the AI is likely not distinguishing between "What are your treatment goals?" (a textarea) and "List three things..." (an info_text + 3 text inputs).

### Issue 2: Missing labels for education and marital status (Image 51)
**What's wrong**: "What is your highest education?" label is missing — just bare checkboxes (High school, College, Degree, Other) with no group label. Same for "Marital status:" — checkboxes with no label. There's also a stray empty text box under "Were there problems with your birth?".
**Root cause**: On the PDF, these are clearly checkbox groups with a visible question/label: "What is your highest education? □ High school □ College □ Degree □ Other". The AI should be producing a `checkbox_group` with `label: "What is your highest education?"` and `options: ["High school", "College", "Degree", "Other"]` — but instead it seems to be producing individual checkboxes without any parent label. Same for marital status.

### Issue 3: Empty Systems Review sections (Image 52)
**What's wrong**: GENERAL, NERVOUS SYSTEM, PSYCHIATRIC appear as section headers with a single empty text box each — all the actual checkbox items are missing.
**Root cause**: The Systems Review page on the PDF is a dense 3-column layout. The AI is creating the section headers but failing to extract the individual checkboxes beneath them. The checkboxes that DO appear (Image 53) are jumbled into the wrong section.

### Issue 4: Cross-section checkbox contamination (Image 53)
**What's wrong**: Under "STOMACH AND INTESTINES" section, checkboxes from GENERAL ("Food cravings"), PSYCHIATRIC ("Frequent crying", "Sensitivity", "Thoughts of suicide/attempts", "Stress Irritability"), and MUSCLE/JOINTS/BONES ("Numbness", "Joint pain", "Muscle weakness", "Joint swelling") are all mixed in. "Where?" text field is correctly there but its context is wrong.
**Root cause**: The 3-column table layout on page 4 is confusing the AI. It reads across rows instead of down columns, mixing items from different sections.

### Issue 5: Substance table column order (Image 54)
**What's wrong**: The tick column (✓) from the original PDF is missing. "Currently still use?" appears as the last column with text inputs instead of Yes/No dropdowns. The original PDF has the tick column FIRST (right after Drug Category), then the detail columns, with "Currently still use?" as Yes/No checkboxes at the END.
**Root cause**: Despite our SUBSTANCE USE TABLES rule, the AI is reordering columns and dropping the tick/checkmark column. The "Currently still use?" column should render as Yes/No dropdowns (the SubstanceTable component already supports this via `isYesNoColumn`), but it's generating text inputs.

### Solution: Two-Part Approach

**Part 1: Add reasoning/analysis output from the AI**

Modify the edge function to request the AI also output its reasoning about the document's structure BEFORE extracting, as a separate text field. This will let us see what the AI "sees" and debug future issues. Add a `reasoning` field to the tool schema.

**Part 2: Strengthen the prompt for these specific failure modes**

Add/revise rules in `FIELD_TYPES_REFERENCE`:

```
## In PATTERN RECOGNITION (section 6):

- LABELLED CHECKBOX GROUPS: When the document shows a question label followed 
  by a horizontal row of checkbox options on the SAME line (e.g. "What is your 
  highest education? □ High school □ College □ Degree □ Other"), this is a 
  "checkbox_group" with the question as "label" and the options as "options". 
  Do NOT break these into individual checkbox fields. Similarly, "Marital 
  status: □ Never married □ Married □ Divorced..." is a checkbox_group.

- MULTI-COLUMN SYSTEMS REVIEW / CHECKLIST PAGES: When a page contains a dense 
  multi-column layout where each COLUMN represents a different body system or 
  category (e.g. Column 1 = GENERAL, Column 2 = NERVOUS SYSTEM, Column 3 = 
  PSYCHIATRIC), you MUST read EACH COLUMN INDEPENDENTLY from top to bottom. 
  Do NOT read across rows. Each column's heading becomes a section_header, and 
  the items beneath it become checkbox fields belonging to that section. Verify 
  every checkbox item is placed under its correct column heading.

## In LAYOUT RULES (section 5):

- COLUMN-BASED READING ORDER: For pages with multi-column checkbox grids 
  (like a Systems Review page), read vertically within each column, not 
  horizontally across the page. Create section_headers for each column heading 
  and list ALL items from that column before moving to the next column.
```

Revise the SUBSTANCE USE TABLES rule to be more explicit:
```
- SUBSTANCE USE TABLES: Read the column headers from the original table 
  left-to-right. If there is a tick/checkmark (✓) column, include it as 
  "Yes/No" in the columns array at the same position. The "Currently still 
  use?" column should appear in its original position and be named exactly 
  "Currently still use?" so the renderer recognises it as a Yes/No dropdown. 
  Preserve the original column ORDER from the document.
```

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/extract-form-template/index.ts` | Add reasoning field to tool schema; add 3 new rules; strengthen substance table rule |

### Redeploy + Re-import Required

After deployment, re-upload the PDF to test with the improved prompt. The reasoning output will help diagnose any remaining issues.

