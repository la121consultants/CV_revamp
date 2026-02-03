import { describe, it, expect } from "vitest";
import { buildDocumentModel } from "@/lib/documentModel";

describe("documentModel", () => {
  it("parses a CV into sections and bullets", () => {
    const raw = `# Product Manager\n\n## Professional Summary\nExperienced PM.\n\n## Key Skills\n- Roadmapping\n- Analytics`;
    const model = buildDocumentModel(raw, "cv");

    expect(model.sections.length).toBeGreaterThan(1);
    expect(model.sections[0].title).toBe("Professional Summary");
    expect(model.sections[1].bullets).toEqual(["Roadmapping", "Analytics"]);
    expect(model.sections[model.sections.length - 1].title).toBe("References");
    const summaryWords = model.sections[0].paragraphs[0].split(/\s+/).filter(Boolean).length;
    expect(summaryWords).toBeGreaterThanOrEqual(100);
  });

  it("parses a cover letter with greeting and sign-off", () => {
    const raw = `Dear Hiring Manager,\n\nI am excited to apply.\n\nBest regards,\nAlex`;
    const model = buildDocumentModel(raw, "coverLetter");

    expect(model.coverLetter?.greeting).toBe("Dear Hiring Manager,");
    expect(model.coverLetter?.signOff).toBe("Best regards,");
    expect(model.coverLetter?.signature).toBe("Alex");
  });
});
