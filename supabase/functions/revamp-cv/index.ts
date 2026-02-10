import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  getSupabaseAdmin,
  getUsageDate,
  isActiveSubscription,
  normalizeIdentifier,
} from "../_shared/usage.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, jobTitle, jobDescription, personSpec, userName, userEmail, outputType } =
      await req.json();

    if (!userEmail || !jobTitle) {
      return new Response(
        JSON.stringify({ error: "Email and job title are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // --- usage guard ---
    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = normalizeIdentifier(userEmail);
    const usageDate = getUsageDate();

    // Check if user is admin/super_admin — skip usage limits
    const { data: adminUser } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    let isAdmin = false;
    if (adminUser?.user_id) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", adminUser.user_id)
        .in("role", ["super_admin", "admin"])
        .limit(1);
      isAdmin = !!(roleData && roleData.length > 0);
    }

    // Also check unlimited_access_grants
    const { data: grantData } = await supabaseAdmin
      .from("unlimited_access_grants")
      .select("id")
      .eq("user_email", normalizedEmail)
      .eq("is_active", true)
      .limit(1);
    const hasUnlimitedGrant = !!(grantData && grantData.length > 0);

    const { data: subscriptionData } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_identifier", normalizedEmail)
      .maybeSingle();

    const hasActiveSub = isActiveSubscription(subscriptionData);
    const skipUsageLimit = isAdmin || hasUnlimitedGrant || hasActiveSub;

    let currentUsage = 0;
    if (!skipUsageLimit) {
      const { data: usageData } = await supabaseAdmin
        .from("user_usage")
        .select("cv_revamp_count")
        .eq("user_identifier", normalizedEmail)
        .eq("usage_date", usageDate)
        .maybeSingle();

      currentUsage = usageData?.cv_revamp_count ?? 0;
      if (currentUsage >= 1) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please upgrade your plan." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- build prompts ---
    const wantCV = outputType === "cv" || outputType === "both";
    const wantLetter = outputType === "coverLetter" || outputType === "both";

    const systemPrompt = `You are a professional UK CV writer. You produce ATS-optimised, role-relevant CVs and cover letters in UK English. Always respond with ONLY valid JSON – no markdown code fences, no explanation.

CRITICAL RULES YOU MUST FOLLOW:
1. Use ONLY the candidate's actual name exactly as provided. NEVER invent names or use placeholder names. NEVER use "Alex Mitchell" or any other fabricated name.
2. All personal details (name, location, job titles, employment history, dates, education, skills, certifications) must match the uploaded CV exactly.
3. Use the candidate's location exactly as provided — do NOT change, generalise, or assume a different city or country.
4. Do NOT add information not present in the uploaded CV — no invented employers, qualifications, responsibilities, or metrics.
5. You MAY improve wording, structure, clarity, bullet point conciseness, and optimise phrasing for UK job applications.
6. You may NOT change factual details, add roles/employers/education, or insert example content.
7. If any detail is missing or unclear, leave it unchanged rather than guessing.
8. The final CV must contain ZERO references to any name other than the candidate's own name.`;

    const userPrompt = `
Candidate name: ${userName || "Not specified"}
Existing CV content:
${cvText || "None provided"}

Target role: ${jobTitle}
Job description:
${jobDescription || "Not provided"}

${personSpec ? `Person specification:\n${personSpec}` : ""}

Please produce a JSON object with the following keys:
${wantCV ? `"cv": A full, professionally rewritten CV in Markdown format tailored to the target role. Use ONLY the information from the candidate's existing CV. Include sections: Professional Summary, Key Skills, Professional Experience (with bullet-point achievements using action verbs), Education. Use UK English. The candidate's real name and location MUST appear exactly as provided.` : ""}
${wantLetter ? `"coverLetter": A compelling cover letter in Markdown format addressed to the Hiring Manager for the target role. Use ONLY information from the candidate's existing CV. Highlight relevant experience. Use UK English. Use the candidate's real name.` : ""}

Return ONLY the JSON object, nothing else.`;

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
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result: { cv?: string; coverLetter?: string };
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
      // Fallback: treat entire response as CV
      result = { cv: rawContent, coverLetter: "" };
    }

    if (!skipUsageLimit) {
      if (currentUsage === 0) {
        await supabaseAdmin.from("user_usage").insert({
          user_identifier: normalizedEmail,
          usage_date: usageDate,
          cv_revamp_count: 1,
        });
      } else {
        await supabaseAdmin
          .from("user_usage")
          .update({ cv_revamp_count: currentUsage + 1 })
          .eq("user_identifier", normalizedEmail)
          .eq("usage_date", usageDate);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("revamp-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
