import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { CVData } from "@/types/cv";

const headingStyle = (text: string) =>
  new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });

const detailText = (text: string) =>
  new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 90 },
  });

const bullet = (text: string) =>
  new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 60 },
  });

export const exportToDOCX = async (data: CVData, templateName: string) => {
  const { personal, skills, experience, education } = data;

  const title = `${personal.firstName} ${personal.lastName}`.trim();
  
  const contactParts = [
    personal.location,
    personal.phone,
    personal.email,
    personal.linkedin,
    personal.portfolio,
  ].filter(Boolean);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: title, bold: true, size: 32 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: personal.title, size: 22 })],
            spacing: { after: 120 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: contactParts.join(" | "),
                size: 20,
              }),
            ],
            spacing: { after: 240 },
          }),
          headingStyle("Professional Summary"),
          detailText(personal.summary),
          headingStyle("Key Skills"),
          ...skills.map((skill) => bullet(skill.name)),
          headingStyle("Work Experience"),
          ...experience.flatMap((item) => [
            new Paragraph({
              children: [
                new TextRun({ text: item.role, bold: true }),
                new TextRun({ text: ` — ${item.company}${item.location ? ` (${item.location})` : ''}` }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `${item.startDate} - ${item.endDate}` })],
              spacing: { after: 60 },
            }),
            ...item.bullets.map((point) => bullet(point)),
          ]),
          headingStyle("Education"),
          ...education.flatMap((item) => [
            new Paragraph({
              children: [
                new TextRun({ text: item.qualification, bold: true }),
                new TextRun({ text: ` — ${item.institution}` }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `${item.startDate} - ${item.endDate}` })],
              spacing: { after: 60 },
            }),
            ...(item.details?.map((detail) => bullet(detail)) || []),
          ]),
          new Paragraph({
            text: "References available on request",
            spacing: { before: 240 },
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Template: ${templateName}`,
            spacing: { before: 240 },
            border: {
              top: {
                style: BorderStyle.SINGLE,
                size: 2,
                color: "E2E8F0",
              },
            },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${personal.firstName}-${personal.lastName}-cv.docx`.toLowerCase();
  link.click();
  URL.revokeObjectURL(url);
};
