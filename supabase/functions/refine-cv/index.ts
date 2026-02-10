import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/usage.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentCV, currentCoverLetter, userMessage, jobTitle, jobDescription, personSpec, outputType } = await req.json();

    if (!currentCV && !currentCoverLetter) {
      return new Response(
        JSON.stringify({ error: "No CV or cover letter content provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const hasCV = outputType === "cv" || outputType === "both";
    const hasLetter = outputType === "coverLetter" || outputType === "both";

    const systemPrompt = `You are a professional UK CV refinement assistant. The user has already generated a CV and/or cover letter. They are now asking you to make specific improvements.

ATS KEYWORD ALIGNMENT:
0a. When making any change, ensure the updated text uses keywords and terminology from the target job description where they truthfully match the candidate's experience.
0b. Mirror exact phrases from the job description (e.g. "stakeholder engagement", "continuous improvement", "safeguarding") rather than using synonyms, where the candidate demonstrably has that skill.
0c. When improving bullet points, prioritise adding ATS-friendly action verbs and sector-specific terms from the target role.

CRITICAL RULES:
1. Apply ONLY the changes the user requests. Do not rewrite sections they didn't mention.
2. Preserve all existing structure, formatting, and Markdown headings (## Section Title).
3. Keep the candidate's real name, dates, employers, and factual details unchanged.
4. Use UK English throughout.
5. Maintain the mandatory section order and never remove sections.
6. Each job role must have a maximum of 6 bullet points.
7. "References available on request" must remain as the final line of the CV, appearing exactly once.
8. Do NOT add fabricated information, roles, or qualifications.
9. Do NOT repeat the same phrases across bullet points.
10. Use strong, varied action verbs.

After making changes, also provide:
- A brief summary of what you changed (2-3 sentences max)
- 3 contextual follow-up suggestions the user might want to try next (short phrases, max 8 words each)

Return ONLY valid JSON with these keys:
${hasCV ? '"cv": the full updated CV in Markdown,' : ''}
${hasLetter ? '"coverLetter": the full updated cover letter in Markdown,' : ''}
"summary": a brief description of changes made,
"followUpSuggestions": an array of 3 short suggestion strings`;

    const userPrompt = `Here is the current content:

${hasCV && currentCV ? `CURRENT CV:\n${currentCV}\n` : ""}
${hasLetter && currentCoverLetter ? `CURRENT COVER LETTER:\n${currentCoverLetter}\n` : ""}

USER REQUEST: ${userMessage}

Target role: ${jobTitle || "Not specified"}
${jobDescription ? `\nJOB DESCRIPTION (use keywords from this to align the CV for ATS):\n${jobDescription}\n` : ""}
${personSpec ? `\nPERSON SPECIFICATION (ensure essential criteria are evidenced using this spec's terminology):\n${personSpec}\n` : ""}
Apply the requested changes and return the complete updated document(s) as JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    let result: {
      cv?: string;
      coverLetter?: string;
      summary?: string;
      followUpSuggestions?: string[];
    };
    try {
      const cleaned = rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      result = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
    } catch {
      // If JSON parsing fails, treat as plain text update
      result = {
        cv: hasCV ? rawContent : undefined,
        coverLetter: hasLetter ? rawContent : undefined,
        summary: "Applied your requested changes.",
        followUpSuggestions: [
          "Make it more concise",
          "Add stronger action verbs",
          "Emphasise key achievements",
        ],
      };
    }

    // Ensure followUpSuggestions always exists
    if (!result.followUpSuggestions || result.followUpSuggestions.length === 0) {
      result.followUpSuggestions = [
        "Make it more concise",
        "Add stronger action verbs",
        "Emphasise key achievements",
      ];
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refine-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
