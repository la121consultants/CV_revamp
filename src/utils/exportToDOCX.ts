import type { CVData } from "@/types/cv";

const xmlEscape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const paragraph = (text: string) =>
  `<w:p><w:r><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`;

const heading = (text: string) =>
  `<w:p><w:pPr><w:pStyle w:val="Heading2" /></w:pPr><w:r><w:t>${xmlEscape(
    text.toUpperCase()
  )}</w:t></w:r></w:p>`;

const createDocumentXml = (data: CVData, templateName: string) => {
  const { personal, skills, experience, education } = data;
  const contactParts = [
    personal.location,
    personal.phone,
    personal.email,
    personal.linkedin,
    personal.portfolio,
  ].filter(Boolean);

  const paragraphs: string[] = [];
  const title = `${personal.firstName} ${personal.lastName}`.trim();
  paragraphs.push(paragraph(title));
  if (personal.title) paragraphs.push(paragraph(personal.title));
  if (contactParts.length > 0) {
    paragraphs.push(paragraph(contactParts.join(" | ")));
  }

  paragraphs.push(heading("Professional Summary"));
  if (personal.summary) paragraphs.push(paragraph(personal.summary));

  paragraphs.push(heading("Key Skills"));
  skills.forEach((skill) => paragraphs.push(paragraph(`• ${skill.name}`)));

  paragraphs.push(heading("Work Experience"));
  experience.forEach((item) => {
    paragraphs.push(paragraph(`${item.role} — ${item.company}${item.location ? ` (${item.location})` : ""}`));
    paragraphs.push(paragraph(`${item.startDate} - ${item.endDate}`));
    item.bullets.forEach((point) => paragraphs.push(paragraph(`• ${point}`)));
  });

  paragraphs.push(heading("Education"));
  education.forEach((item) => {
    paragraphs.push(paragraph(`${item.qualification} — ${item.institution}`));
    paragraphs.push(paragraph(`${item.startDate} - ${item.endDate}`));
    (item.details || []).forEach((detail) => paragraphs.push(paragraph(`• ${detail}`)));
  });

  paragraphs.push(paragraph("References available on request"));
  paragraphs.push(paragraph(`Template: ${templateName}`));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840" />
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0" />
    </w:sectPr>
  </w:body>
</w:document>`;
};

const createZip = (files: { name: string; data: Uint8Array }[]): Blob => {
  const encoder = new TextEncoder();
  const fileEntries: {
    localHeader: Uint8Array;
    centralHeader: Uint8Array;
    data: Uint8Array;
  }[] = [];

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let j = 0; j < 8; j += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  const crc32 = (data: Uint8Array) => {
    let crc = 0xffffffff;
    data.forEach((byte) => {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    });
    return (crc ^ 0xffffffff) >>> 0;
  };

  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, file.data.length, true);
    view.setUint32(22, file.data.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, file.data.length, true);
    centralView.setUint32(24, file.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    fileEntries.push({ localHeader, centralHeader, data: file.data });
    offset += localHeader.length + file.data.length;
  });

  const centralDirectory = fileEntries.map((entry) => entry.centralHeader);
  const centralSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0);
  const centralOffset = offset;

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, fileEntries.length, true);
  endView.setUint16(10, fileEntries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  endView.setUint16(20, 0, true);

  const blobParts: BlobPart[] = [];
  fileEntries.forEach((entry) => {
    blobParts.push(entry.localHeader as BlobPart, entry.data as BlobPart);
  });
  centralDirectory.forEach((cd) => blobParts.push(cd as BlobPart));
  blobParts.push(endRecord as BlobPart);

  return new Blob(blobParts, { type: "application/zip" });
};

export const exportToDOCX = async (data: CVData, templateName: string) => {
  const encoder = new TextEncoder();
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = createDocumentXml(data, templateName);
  const zip = createZip([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypes) },
    { name: "_rels/.rels", data: encoder.encode(rels) },
    { name: "word/document.xml", data: encoder.encode(documentXml) },
  ]);
  const blob = new Blob([zip], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileName = `${data.personal.firstName}-${data.personal.lastName}-cv.docx`.toLowerCase();
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
