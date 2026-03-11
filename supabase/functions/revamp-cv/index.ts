import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  getSupabaseAdmin,
  getUsageDate,
  isActiveSubscription,
  normalizeIdentifier,
} from "../_shared/usage.ts";
import { requireAuth } from "../_shared/auth.ts";
import { errorResponse } from "../_shared/errors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { cvText, jobTitle, jobDescription, personSpec, userName, outputType } =
      await req.json();

    if (!jobTitle) {
      return errorResponse("ERR_2002_INVALID_REQUEST", "Job title is required.");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("ERR_2005_SERVICE_MISCONFIGURED");
    }

    // --- usage guard ---
    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = normalizeIdentifier(authResult.email);
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
        return errorResponse("ERR_2001_USAGE_LIMIT_REACHED", "Usage limit reached. Please upgrade your plan.");
      }
    }

    // --- build prompts ---
    const wantCV = outputType === "cv" || outputType === "both";
    const wantLetter = outputType === "coverLetter" || outputType === "both";

    const systemPrompt = `You are a professional UK CV writer. You produce ATS-optimised, role-relevant CVs and cover letters in UK English. Always respond with ONLY valid JSON – no markdown code fences, no explanation.

ATS KEYWORD OPTIMISATION (CRITICAL):
0a. Carefully analyse the provided JOB DESCRIPTION and PERSON SPECIFICATION before rewriting. Extract all key skills, competencies, qualifications, technologies, and action phrases mentioned.
0b. Naturally weave these exact keywords and phrases into the candidate's Professional Summary, Key Skills, and bullet points — but ONLY where they truthfully reflect the candidate's existing experience. Do NOT fabricate experience to match keywords.
0c. Mirror the language of the job description. If the JD says "stakeholder engagement", use that exact phrase (not a synonym) where the candidate already demonstrates that skill.
0d. Prioritise hard skills, certifications, tools, and sector-specific terminology from the JD and person spec in the Key Skills section.
0e. In bullet points, align the candidate's achievements to the JD requirements using the same terminology where truthful (e.g. if the JD says "budget management" and the candidate managed budgets, use "budget management" explicitly).
0f. If the person specification lists essential/desirable criteria, ensure every essential criterion the candidate already meets is clearly evidenced in the CV using the spec's own wording.

CRITICAL RULES YOU MUST FOLLOW:

DATA INTEGRITY:
1. Use ONLY the content from the candidate's uploaded CV. Do NOT add education, qualifications, certifications, skills, roles, employers, responsibilities, metrics, or dates that are not already present.
2. Do NOT infer or assume missing information. If something is unclear or absent, leave it unchanged.

NAME & IDENTITY:
3. Use ONLY the candidate's name exactly as shown on the uploaded CV.
4. NEVER use "Alex Mitchell" or any other placeholder/fabricated name. Remove it entirely if it appears.
5. Do not introduce any other person's name.

LOCATION:
6. Use the candidate's location exactly as written in the uploaded CV.
7. Do NOT modify, generalise, or add a location.

SECTION CONTROL:
8. Only include sections that already exist in the uploaded CV. Do NOT create new sections (e.g. do not add an Education section if one doesn't exist).

MANDATORY SECTION ORDER (use only sections present in the uploaded CV, in this order):
- Personal Profile / Professional Summary
- Key Skills
- Employment History / Work Experience
- Education (formal qualifications, degrees, diplomas)
- Training (professional training, courses, certifications, CPD)
- Additional Information (if applicable)
- References (always last — see rule below)

FORMATTING REQUIREMENTS:
9. Use clear Markdown headings (## Section Title) for each section.
10. Section headers must be distinct and clearly separated.
11. Use bullet points (- ) for lists. Each bullet must be concise and aligned.
12. Maintain consistent spacing between sections — no overcrowding or uneven gaps.
13. Body text must be regular weight. Headings should use ## for bold distinction.

CONTENT QUALITY:
14. NEVER repeat the same words, phrases, or sentence structures within or across sections.
15. Vary language naturally while maintaining a professional tone throughout.
16. Remove filler phrases and unnecessary repetition.
17. Every bullet point must add new, unique value — no duplicated information.
18. Use strong, varied action verbs to open bullet points.

REFERENCES RULE:
19. The phrase "References available on request" must appear EXACTLY ONCE as the final line of the CV.
20. Do NOT include referee names, contact details, or any other reference information.
21. Do NOT repeat the references line anywhere else in the document.

IMPROVEMENTS ALLOWED:
22. You MAY improve wording, structure, clarity, bullet point conciseness, and optimise phrasing for UK job applications.
23. You may NOT change factual details, add roles/employers/education, or insert example content.

FINAL VALIDATION (do this before responding):
- Confirm ATS keywords from the job description and person spec are naturally embedded.
- Confirm all section headers are correctly titled and in the mandatory order.
- Confirm no repeated wording, phrases, or duplicated sections exist.
- Confirm "References available on request" appears once and only at the end.
- Confirm the document reads as professional and employer-ready.

MISSING SECTION SUGGESTIONS:
24. After rewriting, identify any commonly expected CV sections that are MISSING from the uploaded CV (e.g. Education, Skills, Certifications, Professional Summary). For each missing section, provide a suggested version based on the target job description and person specification — but clearly mark these as SUGGESTIONS the user can choose to add, NOT as part of the main CV.`;

    const userPrompt = `
Candidate name: ${userName || "Not specified"}
Existing CV content:
${cvText || "None provided"}

Target role: ${jobTitle}
Job description:
${jobDescription || "Not provided"}

${personSpec ? `Person specification:\n${personSpec}` : ""}

Please produce a JSON object with the following keys:
${wantCV ? `"cv": A professionally rewritten CV in Markdown format tailored to the target role. Follow the mandatory section order. Use ONLY sections and information from the candidate's existing CV. Improve wording and structure but do NOT add new sections, roles, skills, or education not present in the original. The candidate's real name and location MUST appear exactly as provided. Ensure no repeated phrasing across bullets. End with "References available on request" as the final line.` : ""}
${wantLetter ? `"coverLetter": A compelling cover letter in Markdown format addressed to the Hiring Manager for the target role. Use ONLY information from the candidate's existing CV. Highlight relevant experience. Use UK English. Use the candidate's real name. Vary sentence structure and avoid repetition.` : ""}
"suggestions": An array of objects for any commonly expected CV sections that are MISSING from the uploaded CV. Each object should have: "section" (e.g. "Education", "Skills", "Certifications"), "reason" (why it would help for this role), and "suggestedContent" (draft wording based on the job description/person spec that the user could add). If no sections are missing, return an empty array.

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
        return errorResponse("ERR_2004_RATE_LIMITED", "Rate limit exceeded. Please try again shortly.");
      }
      return errorResponse("ERR_2006_UPSTREAM_FAILURE", `AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result: { cv?: string; coverLetter?: string; suggestions?: Array<{ section: string; reason: string; suggestedContent: string }> };
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
      result = { cv: rawContent, coverLetter: "", suggestions: [] };
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
    return errorResponse("ERR_2500_INTERNAL_ERROR");
  }
});
