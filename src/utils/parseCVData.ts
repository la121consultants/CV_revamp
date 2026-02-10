import type { CVData, ExperienceItem, EducationItem } from "@/types/cv";

/**
 * Parse generated CV markdown text into structured CVData for template rendering.
 * Ensures all three templates (Standard, Aesthetic, Signature) show the same content.
 */

const headingRegex = /^#{1,6}\s+(.*)$/;
const bulletRegex = /^[-*•]\s+(.*)$/;

const clean = (s: string) =>
  s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

interface RawSection {
  title: string;
  paragraphs: string[];
  bullets: string[];
}

const parseSections = (text: string): RawSection[] => {
  const lines = text.split(/\r?\n/);
  const sections: RawSection[] = [];
  let current: RawSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(headingRegex);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { title: clean(headingMatch[1]), paragraphs: [], bullets: [] };
      continue;
    }

    // Heuristic heading: short ALL-CAPS-ish line followed by blank
    const looksLikeHeading =
      trimmed.length <= 60 &&
      (i + 1 >= lines.length || lines[i + 1].trim() === "") &&
      /^[A-Z][A-Za-z0-9 \-&,/()]+$/.test(clean(trimmed));

    if (looksLikeHeading && clean(trimmed).length > 2) {
      if (current) sections.push(current);
      current = { title: clean(trimmed), paragraphs: [], bullets: [] };
      continue;
    }

    if (!current) current = { title: "Professional Summary", paragraphs: [], bullets: [] };

    const bulletMatch = trimmed.match(bulletRegex);
    if (bulletMatch) {
      current.bullets.push(clean(bulletMatch[1]));
    } else {
      current.paragraphs.push(clean(trimmed));
    }
  }
  if (current) sections.push(current);
  return sections;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

const findSection = (sections: RawSection[], ...keywords: string[]) =>
  sections.find((s) => {
    const n = norm(s.title);
    return keywords.some((k) => n.includes(k));
  });

const parseExperience = (section: RawSection | undefined): ExperienceItem[] => {
  if (!section) return [];
  // Try to extract structured entries from paragraphs + bullets
  const items: ExperienceItem[] = [];
  let currentItem: Partial<ExperienceItem> | null = null;

  const allLines = [...section.paragraphs, ...section.bullets.map((b) => `• ${b}`)];

  for (const line of allLines) {
    // Date pattern: anything with a date range like "Jan 2020 – Present" or "2018 - 2021"
    const dateMatch = line.match(/(.+?)\s*[|–—-]\s*(\w+\s*\d{4}\s*[–—-]\s*(?:\w+\s*\d{4}|Present|Current))/i);
    if (dateMatch) {
      if (currentItem?.role) items.push(buildExperienceItem(currentItem));
      const dates = dateMatch[2].split(/[–—-]/).map((d) => d.trim());
      currentItem = { role: clean(dateMatch[1]), startDate: dates[0] || "", endDate: dates[1] || "", bullets: [] };
      continue;
    }

    // Company line (usually follows role)
    if (currentItem && !currentItem.company && !line.startsWith("•")) {
      currentItem.company = clean(line);
      continue;
    }

    if (line.startsWith("•") && currentItem) {
      currentItem.bullets = currentItem.bullets || [];
      currentItem.bullets.push(clean(line.replace(/^•\s*/, "")));
      continue;
    }

    // Fallback: treat as a new role if it looks like one
    if (!line.startsWith("•") && line.length < 80 && line.length > 3) {
      if (currentItem?.role) items.push(buildExperienceItem(currentItem));
      currentItem = { role: clean(line), startDate: "", endDate: "", bullets: [] };
    }
  }
  if (currentItem?.role) items.push(buildExperienceItem(currentItem));

  // If parsing yielded nothing useful, create a single entry from all bullets
  if (items.length === 0 && section.bullets.length > 0) {
    items.push({
      company: "",
      role: section.title,
      startDate: "",
      endDate: "",
      bullets: section.bullets,
    });
  }

  return items;
};

const buildExperienceItem = (partial: Partial<ExperienceItem>): ExperienceItem => ({
  company: partial.company || "",
  role: partial.role || "",
  location: "",
  startDate: partial.startDate || "",
  endDate: partial.endDate || "",
  bullets: partial.bullets || [],
});

const parseEducation = (section: RawSection | undefined): EducationItem[] => {
  if (!section) return [];
  const items: EducationItem[] = [];

  const allText = [...section.paragraphs, ...section.bullets];
  let current: Partial<EducationItem> | null = null;

  for (const line of allText) {
    const dateMatch = line.match(/(\d{4}\s*[–—-]\s*(?:\d{4}|Present|Current))/i);
    if (dateMatch || (line.length < 100 && !line.startsWith("•"))) {
      if (current?.qualification) items.push(buildEducationItem(current));
      const dates = dateMatch ? dateMatch[1].split(/[–—-]/).map((d) => d.trim()) : [];
      current = {
        qualification: clean(line.replace(/\d{4}\s*[–—-]\s*(?:\d{4}|Present|Current)/i, "").trim()) || clean(line),
        institution: "",
        startDate: dates[0] || "",
        endDate: dates[1] || "",
        details: [],
      };
    } else if (current) {
      if (!current.institution) {
        current.institution = clean(line);
      } else {
        current.details = current.details || [];
        current.details.push(clean(line));
      }
    }
  }
  if (current?.qualification) items.push(buildEducationItem(current));

  if (items.length === 0 && section.bullets.length > 0) {
    items.push({
      institution: "",
      qualification: section.bullets.join(", "),
      startDate: "",
      endDate: "",
    });
  }

  return items;
};

const buildEducationItem = (partial: Partial<EducationItem>): EducationItem => ({
  institution: partial.institution || "",
  qualification: partial.qualification || "",
  startDate: partial.startDate || "",
  endDate: partial.endDate || "",
  details: partial.details,
});

export const parseCVDataFromMarkdown = (
  markdown: string,
  header?: { name?: string; role?: string; email?: string; phone?: string; city?: string; linkedin?: string; portfolio?: string }
): CVData => {
  const sections = parseSections(markdown);
  const [firstName = "", lastName = ""] = (header?.name || "").split(/\s+/, 2);

  const summarySection = findSection(sections, "professional summary", "summary", "profile", "about");
  const skillsSection = findSection(sections, "skill", "competenc", "expertise");
  const experienceSection = findSection(sections, "experience", "work history", "employment", "career history");
  const educationSection = findSection(sections, "education", "qualification", "academic");

  const summary = summarySection
    ? [...summarySection.paragraphs, ...summarySection.bullets].join(" ")
    : "";

  const skills = skillsSection
    ? [...skillsSection.bullets, ...skillsSection.paragraphs.flatMap((p) => p.split(/[,;]/).map((s) => s.trim()).filter(Boolean))]
        .map((name) => ({ name: clean(name) }))
        .filter((s) => s.name.length > 1)
    : [];

  return {
    personal: {
      firstName,
      lastName,
      title: header?.role || "",
      location: header?.city || "",
      phone: header?.phone || "",
      email: header?.email || "",
      linkedin: header?.linkedin,
      portfolio: header?.portfolio,
      summary,
    },
    skills,
    experience: parseExperience(experienceSection),
    education: parseEducation(educationSection),
  };
};

/** Empty CVData for pre-generation states */
export const emptyCVData: CVData = {
  personal: {
    firstName: "Your",
    lastName: "Name",
    title: "Your Job Title",
    location: "",
    phone: "",
    email: "",
    summary: "Your professional summary will appear here after generating your CV.",
  },
  skills: [],
  experience: [],
  education: [],
};
