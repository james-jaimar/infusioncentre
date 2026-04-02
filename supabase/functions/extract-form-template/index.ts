import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIELD_TYPES_REFERENCE = `
## 1. CORE PRINCIPLES

- Extract ONLY what is explicitly present in the source document. Do NOT add, infer, or supplement any fields, sections, or content.
- Preserve the exact order of sections and fields as they appear in the source document. Do NOT reorder.
- Preserve ALL text content verbatim — every paragraph, bullet point, and detail. This is clinical/legal content that must not be summarised or shortened.

## 2. FIELD TYPE CATALOGUE

1. "section_header" — Visual section divider/title. Uses "label" (heading text). Include a field_name like "section_1".
2. "info_text" — Read-only informational text (terms, side effects, contraindications, instructions). Uses "content" for the text body and "label" for an optional title. CRITICAL: Preserve ALL original text content verbatim.
3. "text" — Single-line text input. Uses "label", "placeholder", "required".
4. "textarea" — Multi-line text input. Uses "label", "placeholder", "required".
5. "number" — Numeric input. Uses "label", "required".
6. "date" — Date picker. Uses "label", "required".
7. "select" — Dropdown. Uses "label", "options" (string array), "required".
8. "radio" — Radio button group. Uses "label", "options" (string array), "required".
9. "checkbox" — Single checkbox (yes/no toggle). Uses "label", "required".
10. "checkbox_group" — Multiple checkboxes. Uses "label", "options" (string array), "required".
11. "signature" — Signature capture pad. Uses "label", "required".
12. "medication_table" — Table for listing medications. Uses "label", "columns" (string array), "max_rows".
13. "vitals_table" — Table for vital signs. Uses "label", "columns" (string array), "max_rows".
14. "vitals_row" — Single row of vital fields. Uses "label", "fields" (string array).
15. "substance_table" — Table for substance use history. Uses "label", "rows" (string array), "columns" (string array).
16. "family_table" — Table for family medical history. Uses "label", "rows" (string array), "columns" (string array).

## 3. FIELD NAMING

- Every field MUST have a unique "field_name" in snake_case (e.g. "patient_name", "consent_checkbox").

## 4. DIGITAL UPGRADE RULES

These rules apply ONLY to input collection methods. All informational and legal text MUST remain verbatim and unmodified.

- Blank lines/underscores for a DATE (e.g. "this ___ day of ___ 20___") → replace with a SINGLE "date" field. Do NOT reproduce the paper layout with multiple text boxes.
- Blank lines/underscores for a SIGNATURE → use a single "signature" field.
- Blank lines for a NAME, ADDRESS, or other single value → use a single "text" field.
- Inline fill-in-the-blank slots within a paragraph of informational text → convert surrounding text to "info_text" and place the input field immediately after, OR use a {{field_name}} template token in the info_text content when the value is collected elsewhere in the form. The referenced field_name must match a field defined elsewhere in the form_schema.
- DATE CONSOLIDATION: When a document contains multiple date-related blanks that all refer to the same signing/agreement event (e.g. "Agreement Effective Date", "Date", "Dated at"), consolidate them into a SINGLE "date" field. Use {{field_name}} tokens in info_text blocks that reference that date inline. Place the single date field near the signature at the bottom. For forms with a signature section, provide exactly ONE date field alongside the signature.

## 5. LAYOUT RULES

- INLINE PAIRING: When the original document places fields on the same line (e.g. "Name: ___ Age: ___"), add "layout_hint": "inline" to BOTH fields so they render side-by-side. Use this for fields like Name, Surname, Age, Weight that naturally sit in rows on paper forms.
- SECTION SEPARATION: Every visually distinct heading, category label, or bold/underlined group title in the document MUST become its own "section_header" field. Do NOT merge sections. If the document shows "GENERAL" as one heading and "MUSCLE/JOINTS/BONES" as another, those are TWO separate section_headers. When in doubt, create more sections rather than fewer.
- SEMANTIC GROUPING: When a signature field has associated fields (e.g. ID number, printed name, date) that belong to the same signatory, assign them the same "group" value (e.g. "group": "patient_signature_group"). When a document has multiple signature blocks (e.g. Patient and Representative/Witness), each block's fields must share a distinct group value. This ensures they render as visual units and prevents cross-block field pairing.
- LAYOUT DENSITY: Analyse how the original document uses space. When checkbox lists are packed tightly in multi-column layouts on the source document (e.g. medical history checklists, systems review with 20+ items in 2-3 columns), add "density": "compact" to each checkbox field in those sections. This tells the renderer to use a tight grid layout matching the original's space efficiency.
- Informational headings (e.g. "What is an iron infusion?") → section_header, followed by info_text with the FULL verbatim content.

## 6. PATTERN RECOGNITION

- YES/NO QUESTIONS: Must use "radio" with options ["Yes", "No"], NOT a checkbox. Checkboxes are only for acknowledgment/consent toggles.
- CONDITIONAL FOLLOW-UPS: "If yes, describe..." or "If yes, please provide details" → use "textarea" or "text" with "conditional_on": { "field": "<parent_field_name>", "value": "Yes" }.
- CHECKBOX WITH DETAIL: When a checkbox item includes a follow-up prompt after a semicolon, comma, or dash (e.g. "Recent weight gain; How much", "Allergies - please list"), split into TWO fields: (1) a "checkbox" with the condition name as label, and (2) a "text" field for the detail with "conditional_on": {"field": "<checkbox_field_name>", "value": "true"} and layout_hint "inline".
- CHECKBOX GRID LAYOUT: When a section contains a list of checkbox items displayed in multiple columns on the document (e.g. symptoms in 2-3 columns), use individual "checkbox" fields with layout_hint "inline". Do NOT use checkbox_group — each item needs its own field_name for independent checking.
- CONDITION/CHECKLIST TABLES: When the document has a table listing conditions/symptoms/items with columns for Yes/tick/check and Details/comments, use "substance_table" with rows = condition names and columns = ["Yes/No", "Details"]. Normalise column headers — even if the original just says "Yes" or uses tick boxes, use "Yes/No".
`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "extract_form_schema",
    description:
      "Extract the complete form structure from the document into a form_schema array",
    parameters: {
      type: "object",
      properties: {
        form_name: {
          type: "string",
          description: "The name/title of the form",
        },
        form_description: {
          type: "string",
          description: "A brief description of the form's purpose",
        },
        form_category: {
          type: "string",
          enum: ["consent", "medical_questionnaire", "administrative", "monitoring"],
          description: "The category this form belongs to",
        },
        form_schema: {
          type: "array",
          description: "The complete array of form fields",
          items: {
            type: "object",
            properties: {
              field_name: { type: "string" },
              field_type: {
                type: "string",
                enum: [
                  "section_header",
                  "info_text",
                  "text",
                  "textarea",
                  "number",
                  "date",
                  "select",
                  "radio",
                  "checkbox",
                  "checkbox_group",
                  "signature",
                  "medication_table",
                  "vitals_table",
                  "vitals_row",
                  "substance_table",
                  "family_table",
                ],
              },
              label: { type: "string" },
              content: { type: "string" },
              required: { type: "boolean" },
              placeholder: { type: "string" },
              options: {
                type: "array",
                items: { type: "string" },
              },
              columns: {
                type: "array",
                items: { type: "string" },
              },
              rows: {
                type: "array",
                items: { type: "string" },
              },
              fields: {
                type: "array",
                items: { type: "string" },
              },
              max_rows: { type: "number" },
              max_length: { type: "number" },
              layout_hint: {
                type: "string",
                enum: ["inline", "full"],
                description: "Layout hint: 'inline' to pair with adjacent field side-by-side, 'full' for full width",
              },
              density: {
                type: "string",
                enum: ["compact", "normal"],
                description: "Render density. 'compact' for tight checkbox grids matching dense paper layouts.",
              },
              group: {
                type: "string",
                description: "Semantic group identifier. Fields sharing the same group value render together as a visual unit (e.g., 'patient_signature_group').",
              },
              conditional_on: {
                type: "object",
                properties: {
                  field: { type: "string", description: "The field_name of the parent field" },
                  value: { type: "string", description: "The value that must match to show this field" },
                },
                description: "Only show this field when the referenced parent field has the specified value",
              },
            },
            required: ["field_name", "field_type", "label"],
            additionalProperties: false,
          },
        },
      },
      required: ["form_name", "form_description", "form_category", "form_schema"],
      additionalProperties: false,
    },
  },
};

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

  const keepIdx = dateIndices[dateIndices.length - 1];
  const dropNames = new Set<string>();

  dateIndices.forEach((idx) => {
    if (idx !== keepIdx) dropNames.add(fields[idx].field_name);
  });

  fields[keepIdx].field_name = "date";
  fields[keepIdx].label = "Date";
  if (fields[keepIdx].layout_hint === "inline") delete fields[keepIdx].layout_hint;

  extracted.form_schema = fields.filter((_: any, i: number) =>
    !dateIndices.includes(i) || i === keepIdx
  );

  extracted.form_schema.forEach((f: any) => {
    if (f.field_type === "info_text" && f.content) {
      for (const name of dropNames) {
        f.content = f.content.replaceAll(`{{${name}}}`, "{{date}}");
      }
    }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileName, mimeType } = await req.json();

    if (!fileBase64) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isImage = mimeType?.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    const userContent: any[] = [];

    if (isImage || isPdf) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${fileBase64}`,
        },
      });
      userContent.push({
        type: "text",
        text: `This is a clinical/administrative form document (${fileName}). Extract its COMPLETE content into a structured form_schema JSON array. Extract ONLY what is in the document — do not add, infer, or supplement any fields or content. Preserve ALL text verbatim. Maintain the exact order of the original document. Pay close attention to the LAYOUT — fields that appear on the same line should use layout_hint "inline". You MAY upgrade paper-form input patterns (blank lines, underscores, split date fields) into proper digital inputs (date pickers, single text fields, signatures), but all informational and legal text must remain verbatim.`,
      });
    } else {
      const textContent = atob(fileBase64);
      userContent.push({
        type: "text",
        text: `This is the text content of a clinical/administrative form document (${fileName}). Extract its COMPLETE content into a structured form_schema JSON array. Extract ONLY what is in the document — do not add, infer, or supplement any fields or content. Preserve ALL text verbatim. Maintain the exact order. Fields on the same line should use layout_hint "inline". Yes/No questions must be radio buttons. Conditional follow-ups must use conditional_on. You MAY upgrade paper-form input patterns (blank lines, underscores, split date fields) into proper digital inputs (date pickers, single text fields, signatures), but all informational and legal text must remain verbatim.\n\n---\n${textContent}`,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150_000);

    let response: Response;
    try {
    response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a clinical form digitisation expert. You receive scanned or digital documents of medical forms and convert them into structured JSON form schemas that are exact digital replicas of the source document.

STRICT RULES:
- Extract ONLY what is explicitly present in the source document.
- Do NOT add, infer, or supplement any fields, sections, or content.
- Do NOT reorder sections or fields. Maintain the exact document order.
- Do NOT add signature fields, date fields, or checkboxes that are not in the original.

${FIELD_TYPES_REFERENCE}

Return ONLY the form_schema array using the extract_form_schema tool. Do not include any other text.`,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
          tools: [TOOL_SCHEMA],
          tool_choice: {
            type: "function",
            function: { name: "extract_form_schema" },
          },
        }),
      }
    );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const responseText = await response.text();
    console.log("AI response length:", responseText.length);
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse AI response. Length:", responseText.length, "First 500 chars:", responseText.substring(0, 500));
      throw new Error("AI returned an invalid response. The document may be too complex — try a simpler or shorter PDF.");
    }

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured output");
    }

    const toolArgsRaw = toolCall.function.arguments;
    let extracted;
    try {
      extracted = JSON.parse(toolArgsRaw);
      consolidateDateFields(extracted);
    } catch (parseErr) {
      console.error("Failed to parse tool arguments. Length:", toolArgsRaw.length, "First 500 chars:", toolArgsRaw.substring(0, 500));
      throw new Error("AI returned truncated form data. Try uploading a simpler or shorter document.");
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-form-template error:", e);
    const message = e instanceof Error
      ? (e.name === "AbortError" ? "The AI took too long to process this document. Please try again." : e.message)
      : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
