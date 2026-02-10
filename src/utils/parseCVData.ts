import type { CVData, ExperienceItem, EducationItem, ProjectItem } from "@/types/cv";

/**
 * Parse generated CV markdown text into structured CVData for template rendering.
 * Ensures all three templates (Standard, Aesthetic, Signature) show the same content.
 *
 * GLOBAL RULE: All 7 mandatory sections must always be present:
 * 1. Personal Details / Header
 * 2. Professional Summary
 * 3. Key Skills
 * 4. Work Experience
 * 5. Education
 * 6. Projects
 * 7. References
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
  level: number; // heading level: 1-6 for markdown headings, 99 for heuristic headings
}

/** Known top-level CV section keywords */
const TOP_LEVEL_KEYS = [
  "professional summary", "summary", "profile", "about",
  "skill", "competenc", "expertise", "key skills",
  "experience", "work history", "employment", "career history", "work experience",
  "education", "qualification", "academic", "training",
  "project", "placement", "internship",
  "references", "hobbies", "interests", "certifications", "achievements",
  "personal details", "contact details", "contact information", "contact",
  "personal information", "personal", "details",
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

const isTopLevelSection = (title: string): boolean => {
  const n = norm(title);
  return TOP_LEVEL_KEYS.some((k) => n.includes(k) || n === k);
};

const parseSections = (text: string): RawSection[] => {
  const lines = text.split(/\r?\n/);
  const sections: RawSection[] = [];
  let current: RawSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Check for markdown heading
    const headingMatch = trimmed.match(headingRegex);
    if (headingMatch) {
      const level = (trimmed.match(/^(#{1,6})/)![1]).length;
      const title = clean(headingMatch[1]);

      // Only start a new section for top-level headings OR level <= 2
      // Sub-headings (###, ####) within experience/education are treated as content
      if (level <= 2 || isTopLevelSection(title)) {
        if (current) sections.push(current);
        current = { title, paragraphs: [], bullets: [], level };
      } else {
        // Sub-heading: treat as content within current section
        if (!current) current = { title: "Professional Summary", paragraphs: [], bullets: [], level: 2 };
        current.paragraphs.push(clean(headingMatch[1]));
      }
      continue;
    }

    // Heuristic heading: short ALL-CAPS-ish line followed by blank
    const looksLikeHeading =
      trimmed.length <= 60 &&
      (i + 1 >= lines.length || lines[i + 1].trim() === "") &&
      /^[A-Z][A-Za-z0-9 \-&,/()]+$/.test(clean(trimmed));

    if (looksLikeHeading && clean(trimmed).length > 2 && isTopLevelSection(clean(trimmed))) {
      if (current) sections.push(current);
      current = { title: clean(trimmed), paragraphs: [], bullets: [], level: 99 };
      continue;
    }

    if (!current) current = { title: "Professional Summary", paragraphs: [], bullets: [], level: 2 };

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

/** Titles that represent repeated personal/contact detail blocks to be excluded */
const personalDetailTitles = new Set([
  "personal details", "contact details", "contact information", "contact",
  "personal information", "personal", "details",
]);

const findSection = (sections: RawSection[], ...keywords: string[]) =>
  sections.find((s) => {
    const n = norm(s.title);
    if (personalDetailTitles.has(n)) return false;
    return keywords.some((k) => n.includes(k));
  });

/** Collect ALL sections matching keyword (in case content is fragmented across multiple sections) */
const findAllSections = (sections: RawSection[], ...keywords: string[]): RawSection | undefined => {
  const matches = sections.filter((s) => {
    const n = norm(s.title);
    if (personalDetailTitles.has(n)) return false;
    return keywords.some((k) => n.includes(k));
  });
  if (matches.length === 0) return undefined;
  // Merge all matches into one
  return {
    title: matches[0].title,
    paragraphs: matches.flatMap((m) => m.paragraphs),
    bullets: matches.flatMap((m) => m.bullets),
    level: matches[0].level,
  };
};

// Broad date-range regex
const dateRangeRegex = /(\w+\s+\d{4}\s*[–—\-]\s*(?:\w+\s+\d{4}|Present|Current)|\d{4}\s*[–—\-]\s*(?:\d{4}|Present|Current))/i;

const parseExperience = (section: RawSection | undefined): ExperienceItem[] => {
  if (!section) return [];
  const items: ExperienceItem[] = [];
  let currentItem: Partial<ExperienceItem> | null = null;

  const allLines = [...section.paragraphs, ...section.bullets.map((b) => `• ${b}`)];

  for (const line of allLines) {
    const dateInLine = line.match(dateRangeRegex);

    // Pattern: "Role | dates" or "Role – dates"
    const dateMatch = line.match(/(.+?)\s*[|–—-]\s*(\w+\s*\d{4}\s*[–—-]\s*(?:\w+\s*\d{4}|Present|Current))/i);
    if (dateMatch) {
      if (currentItem?.role) items.push(buildExperienceItem(currentItem));
      const dates = dateMatch[2].split(/[–—-]/).map((d) => d.trim());
      currentItem = { role: clean(dateMatch[1]), startDate: dates[0] || "", endDate: dates[1] || "", bullets: [] };
      continue;
    }

    // Line is purely a date range
    if (dateInLine && clean(line.replace(dateRangeRegex, "")).length < 5) {
      const dates = dateInLine[1].split(/[–—-]/).map((d) => d.trim());
      if (currentItem) {
        currentItem.startDate = dates[0] || currentItem.startDate || "";
        currentItem.endDate = dates[1] || currentItem.endDate || "";
      }
      continue;
    }

    // Company line (follows role)
    if (currentItem && !currentItem.company && !line.startsWith("•")) {
      currentItem.company = clean(line);
      continue;
    }

    if (line.startsWith("•") && currentItem) {
      currentItem.bullets = currentItem.bullets || [];
      currentItem.bullets.push(clean(line.replace(/^•\s*/, "")));
      continue;
    }

    // Fallback: treat as a new role if short non-bullet line
    if (!line.startsWith("•") && line.length < 100 && line.length > 3) {
      if (currentItem?.role) items.push(buildExperienceItem(currentItem));
      currentItem = { role: clean(line), startDate: "", endDate: "", bullets: [] };
    }
  }
  if (currentItem?.role) items.push(buildExperienceItem(currentItem));

  // Fallback: create entries from raw content
  if (items.length === 0) {
    if (section.paragraphs.length > 0) {
      for (const p of section.paragraphs) {
        items.push({ company: "", role: clean(p), location: "", startDate: "", endDate: "", bullets: [] });
      }
      if (items.length > 0 && section.bullets.length > 0) {
        items[0].bullets = section.bullets.map(b => clean(b));
      }
    } else if (section.bullets.length > 0) {
      items.push({
        company: "", role: section.title, startDate: "", endDate: "", location: "",
        bullets: section.bullets.map(b => clean(b)),
      });
    }
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
        institution: "", startDate: dates[0] || "", endDate: dates[1] || "", details: [],
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

  // Fallback
  if (items.length === 0) {
    if (section.paragraphs.length > 0) {
      for (const p of section.paragraphs) {
        items.push({ institution: "", qualification: clean(p), startDate: "", endDate: "" });
      }
    } else if (section.bullets.length > 0) {
      for (const b of section.bullets) {
        items.push({ institution: "", qualification: clean(b), startDate: "", endDate: "" });
      }
    }
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

const parseProjects = (section: RawSection | undefined): ProjectItem[] => {
  if (!section) return [];
  const items: ProjectItem[] = [];
  const allLines = [...section.paragraphs, ...section.bullets];
  let current: Partial<ProjectItem> | null = null;

  for (const line of allLines) {
    if (line.length < 80 && !line.startsWith("•")) {
      if (current?.title) items.push({ title: current.title, description: current.description || "", contribution: current.contribution });
      current = { title: clean(line), description: "" };
    } else if (current) {
      if (!current.description) {
        current.description = clean(line);
      } else {
        current.contribution = clean(line);
      }
    } else {
      items.push({ title: clean(line), description: "" });
    }
  }
  if (current?.title) items.push({ title: current.title, description: current.description || "", contribution: current.contribution });

  if (items.length === 0 && section.bullets.length > 0) {
    items.push({ title: section.title, description: section.bullets.join(". ") });
  }
  return items;
};

const parseDateToTimestamp = (dateStr: string): number => {
  if (!dateStr) return -Infinity;
  const normalized = dateStr.trim().toLowerCase();
  if (normalized === "present" || normalized === "current") return Infinity;
  const monthYear = dateStr.match(/(\w+)\s+(\d{4})/);
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    return isNaN(d.getTime()) ? -Infinity : d.getTime();
  }
  const yearOnly = dateStr.match(/(\d{4})/);
  if (yearOnly) return new Date(`Jan 1, ${yearOnly[1]}`).getTime();
  return -Infinity;
};

const sortReverseChronological = <T extends { endDate: string; startDate: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const endDiff = parseDateToTimestamp(b.endDate) - parseDateToTimestamp(a.endDate);
    if (endDiff !== 0) return endDiff;
    return parseDateToTimestamp(b.startDate) - parseDateToTimestamp(a.startDate);
  });

export const parseCVDataFromMarkdown = (
  markdown: string,
  header?: { name?: string; role?: string; email?: string; phone?: string; city?: string; linkedin?: string; portfolio?: string }
): CVData => {
  const sections = parseSections(markdown);
  const [firstName = "", lastName = ""] = (header?.name || "").split(/\s+/, 2);

  /** Detect lines that are just personal details */
  const isPersonalDetailLine = (line: string): boolean => {
    const l = line.toLowerCase();
    if (/@/.test(l) && /\d{5,}/.test(l.replace(/\s/g, ""))) return true;
    if (header?.name) {
      const nameWords = header.name.toLowerCase().split(/\s+/);
      const matchesName = nameWords.every(w => l.includes(w));
      if (matchesName && l.length < 200 && (/\d{5,}/.test(l.replace(/\s/g, "")) || /@/.test(l))) return true;
    }
    return false;
  };

  /** Clean sections by stripping embedded personal detail lines */
  const cleanedSections = sections.map(s => ({
    ...s,
    paragraphs: s.paragraphs.filter(p => !isPersonalDetailLine(p)),
    bullets: s.bullets.filter(b => !isPersonalDetailLine(b)),
  }));

  // Use findAllSections for experience/education to handle fragmented content
  const summarySection = findSection(cleanedSections, "professional summary", "summary", "profile", "about");
  const skillsSection = findSection(cleanedSections, "skill", "competenc", "expertise");
  const experienceSection = findAllSections(cleanedSections, "experience", "work history", "employment", "career history");
  const educationSection = findAllSections(cleanedSections, "education", "qualification", "academic", "training");
  const projectsSection = findAllSections(cleanedSections, "project", "placement", "internship");

  const summary = summarySection
    ? [...summarySection.paragraphs, ...summarySection.bullets].join(" ")
    : "";

  const skills = skillsSection
    ? [...skillsSection.bullets, ...skillsSection.paragraphs.flatMap((p) => p.split(/[,;]/).map((s) => s.trim()).filter(Boolean))]
        .map((name) => ({ name: clean(name) }))
        .filter((s) => s.name.length > 1)
    : [];

  const projects = parseProjects(projectsSection);

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
    experience: sortReverseChronological(parseExperience(experienceSection)),
    education: sortReverseChronological(parseEducation(educationSection)),
    projects,
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
  projects: [],
};
