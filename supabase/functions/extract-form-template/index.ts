import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIELD_TYPES_REFERENCE = `
Available field_type values and their properties:

1. "section_header" — A visual section divider/title. Only uses "label" (the heading text). No field_name needed but include one like "section_1".
2. "info_text" — A block of read-only informational text (terms, side effects, contraindications, instructions). Uses "content" for the text body and "label" for an optional title. CRITICAL: Preserve ALL original text content verbatim — every paragraph, bullet point, and detail. This is clinical/legal content that must not be summarized or shortened.
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

CRITICAL RULES:
- Every field MUST have a unique "field_name" (use snake_case, e.g. "patient_name", "consent_checkbox").
- Preserve ALL text content from the document in info_text blocks. Do NOT summarize, truncate, or abbreviate clinical content.
- NEVER add fields, sections, or content that do not exist in the source document. Extract ONLY what is visually present on the page.
- Preserve the exact order of sections and fields as they appear in the source document. Do NOT reorder.
- Do NOT add signature fields, date fields, acknowledgment checkboxes, or any other fields unless they explicitly appear in the original document.

DIGITAL UPGRADE RULES (input methods only — never alter text content):
- When the document uses blank lines, underscores, or split fields to collect a DATE (e.g. "this ___ day of ___ 20___", "Dated at ___ this ___"), replace them with a SINGLE "date" field. Do NOT reproduce the paper layout with multiple text boxes.
- When the document uses blank lines or underscores for a SIGNATURE, use a single "signature" field.
- When the document uses blank lines for a NAME, ADDRESS, or other obvious single value, use a single "text" field — not multiple text boxes replicating the paper underscores.
- When inline text contains fill-in-the-blank slots (e.g. "This agreement will be effective from this ___ day of ___ 20___"), convert the surrounding text to an "info_text" block and place the appropriate input field(s) immediately after it. Do NOT embed blanks as literal text boxes within a sentence.
- When a fill-in-the-blank slot appears WITHIN a paragraph of legal/informational text and refers to a field that will be collected elsewhere in the form (e.g. a date at the bottom), use a {{field_name}} template token in the info_text content instead of splitting the paragraph. Example: "This agreement will be effective from {{agreement_date}} until treatment is completed." The referenced field_name must match a date/text/signature field defined elsewhere in the form_schema.
- These upgrades apply ONLY to input collection methods. All informational text, legal clauses, terms, bullet points, and clinical content MUST remain verbatim and unmodified.

LAYOUT & UX RULES:
- When the original document places fields on the same line (e.g., "Name: ___ Age: ___"), add "layout_hint": "inline" to BOTH fields so they render side-by-side.
- Yes/No questions MUST use "radio" with options ["Yes", "No"], NOT a checkbox. Checkboxes are only for acknowledgment/consent toggles.
- Conditional follow-ups (e.g., "If yes, describe..." or "If yes, please provide details") → use "textarea" or "text" with a "conditional_on" property referencing the parent field_name and expected value. Example: "conditional_on": { "field": "had_previous_infusion", "value": "Yes" }
- When the document has a table of conditions with Yes/Details columns, use "substance_table" with rows=condition names and columns=["Yes/No","Details"].
- Informational headings ("What is an iron infusion?") → section_header, followed by info_text with the FULL verbatim content.
- For fields like Name, Surname, Age, Weight that naturally sit in rows on paper forms, use layout_hint "inline" so they pair up in the digital form.
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
          model: "google/gemini-2.5-pro",
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
