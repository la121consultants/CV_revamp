import type { CVData, ExperienceItem, EducationItem, ProjectItem } from "@/types/cv";

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

/** Titles that represent repeated personal/contact detail blocks to be excluded */
const personalDetailTitles = new Set([
  "personal details", "contact details", "contact information", "contact",
  "personal information", "personal", "details",
]);

const findSection = (sections: RawSection[], ...keywords: string[]) =>
  sections.find((s) => {
    const n = norm(s.title);
    if (personalDetailTitles.has(n)) return false; // skip personal details sections
    return keywords.some((k) => n.includes(k));
  });

const parseExperience = (section: RawSection | undefined): ExperienceItem[] => {
  if (!section) return [];
  const items: ExperienceItem[] = [];
  let currentItem: Partial<ExperienceItem> | null = null;

  const allLines = [...section.paragraphs, ...section.bullets.map((b) => `• ${b}`)];

  // Broad date-range regex: matches "Month Year – Month Year/Present" or "Year – Year/Present"
  const dateRangeRegex = /(\w+\s+\d{4}\s*[–—\-]\s*(?:\w+\s+\d{4}|Present|Current)|\d{4}\s*[–—\-]\s*(?:\d{4}|Present|Current))/i;

  for (const line of allLines) {
    // Check if this line contains a date range anywhere
    const dateInLine = line.match(dateRangeRegex);

    // Try the original pattern: "Role | dates"
    const dateMatch = line.match(/(.+?)\s*[|–—-]\s*(\w+\s*\d{4}\s*[–—-]\s*(?:\w+\s*\d{4}|Present|Current))/i);
    if (dateMatch) {
      if (currentItem?.role) items.push(buildExperienceItem(currentItem));
      const dates = dateMatch[2].split(/[–—-]/).map((d) => d.trim());
      currentItem = { role: clean(dateMatch[1]), startDate: dates[0] || "", endDate: dates[1] || "", bullets: [] };
      continue;
    }

    // Line is purely a date range (dates on their own line)
    if (dateInLine && clean(line.replace(dateRangeRegex, "")).length < 5) {
      const dates = dateInLine[1].split(/[–—-]/).map((d) => d.trim());
      if (currentItem) {
        currentItem.startDate = dates[0] || currentItem.startDate || "";
        currentItem.endDate = dates[1] || currentItem.endDate || "";
      }
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

    // Fallback: treat as a new role if it looks like one (short non-bullet line)
    if (!line.startsWith("•") && line.length < 100 && line.length > 3) {
      if (currentItem?.role) items.push(buildExperienceItem(currentItem));
      currentItem = { role: clean(line), startDate: "", endDate: "", bullets: [] };
    }
  }
  if (currentItem?.role) items.push(buildExperienceItem(currentItem));

  // Fallback: if structured parsing yielded nothing, create entries from raw content
  if (items.length === 0) {
    // Try paragraphs as role titles, bullets as descriptions
    if (section.paragraphs.length > 0) {
      for (const p of section.paragraphs) {
        items.push({ company: "", role: clean(p), location: "", startDate: "", endDate: "", bullets: [] });
      }
      // Attach all bullets to the first item
      if (items.length > 0 && section.bullets.length > 0) {
        items[0].bullets = section.bullets.map(b => clean(b));
      }
    } else if (section.bullets.length > 0) {
      items.push({
        company: "",
        role: section.title,
        startDate: "",
        endDate: "",
        location: "",
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

  // Fallback: if structured parsing yielded nothing, create entries from raw content
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
    // Short lines are likely project titles
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

/**
 * Parse a date string like "Jan 2020", "2020", "Present", "Current" into a
 * comparable timestamp. "Present"/"Current" returns Infinity so it sorts first
 * in reverse-chronological order.
 */
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

/** Sort items in reverse chronological order by endDate then startDate */
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

  /** Detect lines that are just personal details (name + phone/email) embedded in section content */
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

  const summarySection = findSection(cleanedSections, "professional summary", "summary", "profile", "about");
  const skillsSection = findSection(cleanedSections, "skill", "competenc", "expertise");
  const experienceSection = findSection(cleanedSections, "experience", "work history", "employment", "career history");
  const educationSection = findSection(cleanedSections, "education", "qualification", "academic", "training");
  const projectsSection = findSection(cleanedSections, "project", "placement", "internship");

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
