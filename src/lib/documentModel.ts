import { format } from "date-fns";
import type { DocumentKind, DocumentModel, DocumentSection, CoverLetterModel } from "@/types";

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
    sections: orderSections(parsedSections, header),
    header,
    style,
    rawText: sanitized,
  };
};

export { cleanText };
