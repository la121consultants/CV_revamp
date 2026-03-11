import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getGlobalAppSettings, getSupabaseAdmin, getUsageDate, isActiveSubscription, normalizeIdentifier, corsHeaders } from "../_shared/usage.ts";
import { requireAuth } from "../_shared/auth.ts";
import { errorResponse } from "../_shared/errors.ts";

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
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { section, jobTitle, jobDescription, existingContent, userName } = await req.json();

    if (!section || !sectionPrompts[section]) {
      return errorResponse(
        "ERR_2002_INVALID_REQUEST",
        "Invalid section. Must be one of: summary, skills, experience, education, additional"
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("ERR_2005_SERVICE_MISCONFIGURED");
    }

    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = normalizeIdentifier(authResult.email);
    const usageDate = getUsageDate();

    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_identifier", normalizedEmail)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    const hasActiveSubscription = isActiveSubscription(subscriptionData);
    const globalSettings = await getGlobalAppSettings(supabaseAdmin);

    let currentUsageCount = 0;
    if (!hasActiveSubscription && !globalSettings.free_mode_enabled) {
      const { data: usageData, error: usageError } = await supabaseAdmin
        .from("user_usage")
        .select("cv_revamp_count")
        .eq("user_identifier", normalizedEmail)
        .eq("usage_date", usageDate)
        .maybeSingle();

      if (usageError) {
        throw usageError;
      }

      currentUsageCount = usageData?.cv_revamp_count ?? 0;
      if (currentUsageCount >= 1) {
        return errorResponse("ERR_2001_USAGE_LIMIT_REACHED", "Usage limit reached. Please upgrade your plan.");
      }
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
        return errorResponse("ERR_2004_RATE_LIMITED", "Rate limit exceeded. Please try again shortly.");
      }
      if (response.status === 402) {
        return errorResponse("ERR_2001_USAGE_LIMIT_REACHED", "Usage limit reached. Please upgrade your plan.");
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return errorResponse("ERR_2006_UPSTREAM_FAILURE", "AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let suggestions: string[];
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) throw new Error("Not an array");
      suggestions = suggestions.slice(0, 3).map((s: any) => String(s));
    } catch {
      suggestions = content
        .split("\n")
        .map((line: string) => line.replace(/^[\d\-\*\.\)]+\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    if (!hasActiveSubscription && !globalSettings.free_mode_enabled) {
      if (currentUsageCount === 0) {
        const { error: insertError } = await supabaseAdmin
          .from("user_usage")
          .insert({
            user_identifier: normalizedEmail,
            usage_date: usageDate,
            cv_revamp_count: 1,
          });
        if (insertError) {
          throw insertError;
        }
      } else {
        const { error: updateError } = await supabaseAdmin
          .from("user_usage")
          .update({ cv_revamp_count: currentUsageCount + 1 })
          .eq("user_identifier", normalizedEmail)
          .eq("usage_date", usageDate);
        if (updateError) {
          throw updateError;
        }
      }
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-suggestions error:", e);
    return errorResponse("ERR_2500_INTERNAL_ERROR");
  }
});
