

## Plan: Fix Systems Review Cross-Contamination with Explicit Example and Two-Pass Reasoning

### Root Cause

The AI says "reading columns vertically" in its reasoning but doesn't actually do it. The 3-column table on page 4 of the PDF is being read row-by-row (horizontally), which mixes GENERAL items into NERVOUS SYSTEM, PSYCHIATRIC items into EARS, EYES items into SKIN, etc. Abstract rules aren't enough — the AI needs a concrete example showing the correct output pattern.

### What the Screenshots Show

- **Image 55**: GENERAL and NERVOUS SYSTEM sections are completely empty (no checkboxes). Their items have been scattered into later sections.
- **Image 56**: EARS contains STOMACH AND INTESTINES items ("Persistent diarrhea", "Blood in stools") and PSYCHIATRIC items ("Hallucinations", "Rapid speech", "Guilty thoughts"). EYES is empty. SKIN contains PSYCHIATRIC and EYES items ("Paranoia", "Mood swings", "Anxiety", "Pain", "Loss of vision").

### Solution

**1. Replace the abstract multi-column rule with a concrete worked example**

Instead of just saying "read columns vertically", show the AI exactly what correct output looks like for a 3-column systems review table. This is far more effective than abstract instructions for vision models.

Add to FIELD_TYPES_REFERENCE section 6 (replacing the existing MULTI-COLUMN rule):

```
- MULTI-COLUMN SYSTEMS REVIEW / CHECKLIST PAGES: This is the MOST COMMON 
  extraction error. When a page has a table or grid with 2-3 columns of 
  checkboxes, each column headed by a body system or category name, you MUST:

  Step 1: Identify ALL column headings (e.g. GENERAL, NERVOUS SYSTEM, PSYCHIATRIC)
  Step 2: For EACH column, read TOP to BOTTOM within that column only
  Step 3: Create a section_header for each column heading
  Step 4: List every checkbox item from that column under its section_header
  Step 5: Only after finishing ALL items in one column, move to the next

  EXAMPLE — if the document shows this 3-column table:
  | GENERAL              | NERVOUS SYSTEM  | PSYCHIATRIC        |
  | Recent weight gain   | Headaches       | Depression         |
  | Fatigue              | Dizziness       | Excessive worries  |

  CORRECT output (read vertically per column):
  → section_header "GENERAL"
  → checkbox "Recent weight gain"  
  → checkbox "Fatigue"
  → section_header "NERVOUS SYSTEM"
  → checkbox "Headaches"
  → checkbox "Dizziness"
  → section_header "PSYCHIATRIC"
  → checkbox "Depression"
  → checkbox "Excessive worries"

  WRONG output (reading horizontally across rows):
  → section_header "GENERAL"
  → checkbox "Recent weight gain"
  → checkbox "Headaches"        ← WRONG, this belongs to NERVOUS SYSTEM
  → checkbox "Depression"        ← WRONG, this belongs to PSYCHIATRIC

  When a column contains a SUB-HEADING mid-way (e.g. MUSCLE/JOINTS/BONES 
  appearing mid-way in the GENERAL column), that sub-heading starts a NEW 
  section_header. All items below it in that same column belong to the new section.
```

**2. Require the reasoning field to explicitly list each section and its items**

Change the `reasoning` description in TOOL_SCHEMA to force itemised analysis:

```
"For multi-column pages (like Systems Review), you MUST list each column heading 
and every item beneath it in your reasoning BEFORE extracting. Format: 
'Column 1 [GENERAL]: Recent weight gain, Fatigue, ...' etc. This pre-listing 
step is mandatory for accuracy."
```

**3. Add the COLUMN-BASED rule to the system message itself (not just FIELD_TYPES_REFERENCE)**

Reinforce with a direct instruction in the system message:

```
CRITICAL: For multi-column checkbox grids, read each column TOP-TO-BOTTOM 
independently. Never read across rows.
```

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/extract-form-template/index.ts` | Replace abstract multi-column rule with worked example; update reasoning field description; add reinforcement to system message |

### Redeploy + Re-import Required

After deployment, re-upload the PDF. The reasoning output should now contain an explicit per-column item listing, making it easy to verify correctness before even looking at the form.

