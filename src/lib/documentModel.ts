import { format } from "date-fns";
import type {
  CVStyle,
  DocumentHeader,
  DocumentKind,
  DocumentModel,
  DocumentSection,
  CoverLetterModel,
} from "@/types";

const headingRegex = /^#{1,6}\s+(.*)$/;
const bulletRegex = /^[-*•]\s+(.*)$/;
const horizontalRuleRegex = /^(-{3,}|\*{3,}|_{3,})$/;

const cleanText = (value: string) =>
  value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const ensureSection = (section: DocumentSection | null, fallbackTitle: string) =>
  section ?? {
    title: fallbackTitle,
    paragraphs: [],
    bullets: [],
  };

const hasSectionContent = (section: DocumentSection) =>
  section.paragraphs.length > 0 || section.bullets.length > 0;

const extractHeading = (line: string, nextLine: string | null) => {
  const headingMatch = line.match(headingRegex);
  if (headingMatch) {
    return cleanText(headingMatch[1]);
  }

  const trimmed = cleanText(line);
  if (!trimmed) return null;

  const looksLikeHeading =
    trimmed.length <= 60 &&
    nextLine !== null &&
    nextLine.trim() === "" &&
    /^[A-Z][A-Za-z0-9 \-&,/]+$/.test(trimmed);

  return looksLikeHeading ? trimmed : null;
};

const parseSections = (rawText: string): DocumentSection[] => {
  const lines = rawText.split(/\r?\n/);
  const sections: DocumentSection[] = [];
  let current: DocumentSection | null = null;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || horizontalRuleRegex.test(trimmed)) {
      return;
    }

    const heading = extractHeading(trimmed, lines[index + 1] ?? null);
    if (heading) {
      if (current && hasSectionContent(current)) {
        sections.push(current);
      }
      current = {
        title: heading,
        paragraphs: [],
        bullets: [],
      };
      return;
    }

    const bulletMatch = trimmed.match(bulletRegex);
    const safeCurrent = ensureSection(current, "Professional Summary");

    if (bulletMatch) {
      safeCurrent.bullets.push(cleanText(bulletMatch[1]));
    } else {
      safeCurrent.paragraphs.push(cleanText(trimmed));
    }
    current = safeCurrent;
  });

  if (current && hasSectionContent(current)) {
    sections.push(current);
  }

  if (sections.length === 0) {
    sections.push({
      title: "Professional Summary",
      paragraphs: [cleanText(rawText)],
      bullets: [],
    });
  }

  return sections;
};

const sectionOrder = [
  "professional summary",
  "key skills",
  "key achievements",
  "work experience",
  "education",
  "projects",
  "hobbies",
  "references",
];

/**
 * Parse a date string like "Jan 2020", "2020", "Present" into a comparable
 * timestamp. "Present"/"Current" returns Infinity (sorts first in reverse-chrono).
 */
const parseDateStr = (dateStr: string): number => {
  if (!dateStr) return -Infinity;
  const n = dateStr.trim().toLowerCase();
  if (n === "present" || n === "current") return Infinity;
  const my = dateStr.match(/(\w+)\s+(\d{4})/);
  if (my) { const d = new Date(`${my[1]} 1, ${my[2]}`); return isNaN(d.getTime()) ? -Infinity : d.getTime(); }
  const yo = dateStr.match(/(\d{4})/);
  return yo ? new Date(`Jan 1, ${yo[1]}`).getTime() : -Infinity;
};

/** Sort experience bullet groups within a section in reverse chronological order */
const sortExperienceBullets = (section: DocumentSection): DocumentSection => {
  // Each "role block" in a section is: paragraph lines for role/company/dates, then bullets
  // The section as-is from the AI should already be ordered, but we enforce it here.
  // We look for date patterns in paragraphs to identify role boundaries and sort them.
  const dateRangeRegex = /(\w+\s+\d{4}\s*[–—-]\s*(?:\w+\s+\d{4}|Present|Current)|\d{4}\s*[–—-]\s*(?:\d{4}|Present|Current))/i;

  type RoleBlock = { paragraphs: string[]; bullets: string[]; endTimestamp: number; startTimestamp: number };
  const blocks: RoleBlock[] = [];
  let current: RoleBlock | null = null;

  for (const p of section.paragraphs) {
    const match = p.match(dateRangeRegex);
    if (match) {
      if (current) blocks.push(current);
      const dates = match[1].split(/[–—-]/).map(d => d.trim());
      current = { paragraphs: [p], bullets: [], endTimestamp: parseDateStr(dates[1] || ""), startTimestamp: parseDateStr(dates[0] || "") };
    } else if (current) {
      current.paragraphs.push(p);
    } else {
      current = { paragraphs: [p], bullets: [], endTimestamp: -Infinity, startTimestamp: -Infinity };
    }
  }
  for (const b of section.bullets) {
    if (current) current.bullets.push(b);
    else { current = { paragraphs: [], bullets: [b], endTimestamp: -Infinity, startTimestamp: -Infinity }; }
  }
  if (current) blocks.push(current);

  if (blocks.length <= 1) return section;

  blocks.sort((a, b) => {
    const diff = b.endTimestamp - a.endTimestamp;
    return diff !== 0 ? diff : b.startTimestamp - a.startTimestamp;
  });

  return {
    title: section.title,
    paragraphs: blocks.flatMap(bl => bl.paragraphs),
    bullets: blocks.flatMap(bl => bl.bullets),
  };
};

const normalizeTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

const orderSections = (sections: DocumentSection[], header?: DocumentHeader) => {
  // Filter out sections that are just repeated personal/contact details
  const personalDetailTitles = new Set([
    "personal details", "contact details", "contact information", "contact",
    "personal information", "personal", "details",
  ]);

  const isPersonalDetailContent = (section: DocumentSection) => {
    const n = normalizeTitle(section.title);
    if (personalDetailTitles.has(n)) return true;
    // Also catch unnamed sections that are just name/email/phone lines
    if (header && section.paragraphs.length <= 5 && section.bullets.length === 0) {
      const text = section.paragraphs.join(" ").toLowerCase();
      const headerName = header.name?.toLowerCase() || "";
      if (headerName && text.includes(headerName) && (text.includes("@") || text.includes("07"))) return true;
    }
    return false;
  };

  const filtered = sections.filter((s) => !isPersonalDetailContent(s));

  const sectionMap = new Map<string, DocumentSection>();
  filtered.forEach((section) => {
    sectionMap.set(normalizeTitle(section.title), section);
  });

  const experienceKeys = new Set(["work experience", "education"]);
  const ordered: DocumentSection[] = [];
  sectionOrder.forEach((key) => {
    if (key === "references") return;
    const found = sectionMap.get(key);
    if (found) {
      ordered.push(experienceKeys.has(key) ? sortExperienceBullets(found) : found);
    }
  });

  const usedTitles = new Set(ordered.map((section) => normalizeTitle(section.title)));
  usedTitles.add("references");
  personalDetailTitles.forEach((t) => usedTitles.add(t));
  filtered.forEach((section) => {
    const normalized = normalizeTitle(section.title);
    if (!usedTitles.has(normalized)) {
      ordered.push(section);
    }
  });

  // Always add References as the final section with exact standard text
  ordered.push({
    title: "References",
    paragraphs: ["References available on request."],
    bullets: [],
  });

  return ordered;
};

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

const extractSectionText = (sections: DocumentSection[], title: string) => {
  const normalized = normalizeTitle(title);
  const section = sections.find((item) => normalizeTitle(item.title) === normalized);
  if (!section) return "";
  return [...section.paragraphs, ...section.bullets].join(" ");
};

const buildSummaryAddendum = (sections: DocumentSection[], header?: DocumentHeader) => {
  const role = header?.role ?? "professional roles";
  const skillsText = extractSectionText(sections, "key skills");
  const achievementsText = extractSectionText(sections, "key achievements");
  const experienceText = extractSectionText(sections, "work experience");

  const skills = skillsText
    .split(/[,•]/)
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 6);

  const achievements = achievementsText
    .split(/[.;]/)
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 3);

  const experience = experienceText
    .split(/[.;]/)
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 3);

  const skillPhrase = skills.length > 0 ? skills.join(", ") : "core delivery, stakeholder alignment, and quality execution";
  const achievementPhrase =
    achievements.length > 0 ? achievements.join(", ") : "driving measurable improvements and reliable outcomes";
  const experiencePhrase =
    experience.length > 0 ? experience.join(", ") : "end-to-end project delivery and cross-functional collaboration";

  return [
    `A highly proactive individual with extensive experience in ${role}, focused on ${skillPhrase}.`,
    `Known for ${achievementPhrase} and a disciplined approach to continuous improvement.`,
    `Hands-on background in ${experiencePhrase}, with a commitment to clear communication and consistent results.`,
  ].join(" ");
};

const ensureProfessionalSummary = (sections: DocumentSection[], header?: DocumentHeader) => {
  const normalized = "professional summary";
  let summarySection = sections.find((section) => normalizeTitle(section.title) === normalized);

  if (!summarySection) {
    summarySection = {
      title: "Professional Summary",
      paragraphs: [],
      bullets: [],
    };
    sections.unshift(summarySection);
  }

  const existingText = summarySection.paragraphs.join(" ");
  const addendum = buildSummaryAddendum(sections, header);
  let combined = [existingText, addendum].filter(Boolean).join(" ").trim();
  const role = header?.role ?? "the target role";

  while (wordCount(combined) < 100) {
    combined = `${combined} Focused on delivering reliable outcomes in ${role} with strong attention to detail and stakeholder needs.`.trim();
  }

  summarySection.paragraphs = [combined];

  return sections.map((section) => (section === summarySection ? summarySection : section));
};
const parseCoverLetter = (rawText: string): CoverLetterModel => {
  const rawSections = rawText
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  const allLines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const greetingLine =
    allLines.find((line) => /^dear\b/i.test(line)) ?? "Dear Hiring Manager,";

  const signOffIndex = allLines.findIndex((line) =>
    /^(best|kind regards|regards|sincerely|thank you)/i.test(line)
  );

  const signOff = signOffIndex >= 0 ? allLines[signOffIndex] : "Best regards,";
  const signature =
    signOffIndex >= 0 && allLines[signOffIndex + 1]
      ? allLines[signOffIndex + 1]
      : "";

  const greetingIndex = rawSections.findIndex((section) =>
    /^dear\b/i.test(section)
  );

  const bodySections = rawSections.filter((section, index) => {
    if (index === greetingIndex) return false;
    if (index === rawSections.length - 1 && section === signature) return false;
    if (section === signOff) return false;
    return true;
  });

  const paragraphs = bodySections.map((section) => cleanText(section));

  return {
    dateLine: format(new Date(), "MMMM d, yyyy"),
    greeting: cleanText(greetingLine),
    paragraphs: paragraphs.length > 0 ? paragraphs : [cleanText(rawText)],
    signOff: cleanText(signOff),
    signature: cleanText(signature),
  };
};

export const buildDocumentModel = (
  rawText: string,
  kind: DocumentKind,
  header?: DocumentHeader,
  style?: CVStyle
): DocumentModel => {
  const sanitized = rawText.trim();
  if (kind === "coverLetter") {
    return {
      id: "",
      kind,
      title: "Cover Letter",
      sections: [],
      coverLetter: parseCoverLetter(sanitized),
      rawText: sanitized,
    };
  }

  const parsedSections = parseSections(sanitized);

  return {
    id: "",
    kind,
    title: "Tailored CV",
    sections: ensureProfessionalSummary(orderSections(parsedSections, header), header),
    header,
    style,
    rawText: sanitized,
  };
};

export { cleanText };
