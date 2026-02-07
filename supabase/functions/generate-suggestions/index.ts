import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sectionPrompts: Record<string, string> = {
  summary: `Generate exactly 3 professional summary sentences for a CV. Each should be:
- 1-2 sentences long
- Written in UK English
- ATS-friendly with strong action words
- Relevant to the target role
Return ONLY a JSON array of 3 strings, no other text.`,

  skills: `Generate exactly 3 skill-related bullet points for a CV. Each should be:
- A concise skill category or competency statement
- Written in UK English
- ATS-friendly
- Relevant to the target role
Return ONLY a JSON array of 3 strings, no other text.`,

  experience: `Generate exactly 3 achievement bullet points for a work experience entry on a CV. Each should be:
- Start with a strong action verb
- Include quantifiable results where possible
- Written in UK English
- ATS-friendly and relevant to the target role
Return ONLY a JSON array of 3 strings, no other text.`,

  education: `Generate exactly 3 education-related bullet points for a CV. Each should be:
- Relevant academic achievements or qualifications
- Written in UK English
- ATS-friendly
- Related to the target role where possible
Return ONLY a JSON array of 3 strings, no other text.`,

  additional: `Generate exactly 3 additional CV section suggestions (certifications, volunteer work, languages, etc.). Each should be:
- A complete, ready-to-use bullet point
- Written in UK English
- ATS-friendly
- Relevant to the target role
Return ONLY a JSON array of 3 strings, no other text.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, jobTitle, jobDescription, existingContent, userName } = await req.json();

    if (!section || !sectionPrompts[section]) {
      return new Response(
        JSON.stringify({ error: "Invalid section. Must be one of: summary, skills, experience, education, additional" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contextPrompt = `
Target Role: ${jobTitle || "Not specified"}
Job Description: ${jobDescription || "Not specified"}
Candidate Name: ${userName || "Not specified"}
${existingContent ? `Existing content in this section:\n${existingContent}` : "No existing content yet."}

${sectionPrompts[section]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a professional UK CV writer specialising in ATS-optimised, role-relevant content. Always respond with ONLY a valid JSON array of exactly 3 strings. No markdown, no code blocks, no explanations.",
          },
          { role: "user", content: contextPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please upgrade your plan." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse the JSON array from the response
    let suggestions: string[];
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) throw new Error("Not an array");
      suggestions = suggestions.slice(0, 3).map((s: any) => String(s));
    } catch {
      // Fallback: split by newlines
      suggestions = content
        .split("\n")
        .map((line: string) => line.replace(/^[\d\-\*\.\)]+\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-suggestions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
