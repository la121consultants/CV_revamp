import type { DocumentModel } from "@/types";

const xmlEscape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const textEscape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const wrapText = (text: string, maxChars: number) => {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
};

const formatHeading = (text: string, style?: string) => {
  if (style === "boujee") {
    return text.toUpperCase();
  }
  if (style === "aesthetic") {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return text.toUpperCase();
};

const createDocumentXml = (model: DocumentModel) => {
  const paragraphs: string[] = [];
  const pushParagraph = (text: string) => {
    paragraphs.push(`<w:p><w:r><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`);
  };

  const pushHeading = (text: string) => {
    paragraphs.push(
      `<w:p><w:pPr><w:pStyle w:val="Heading2" /></w:pPr><w:r><w:t>${xmlEscape(
        text
      )}</w:t></w:r></w:p>`
    );
  };

  if (model.kind === "cv" && model.header) {
    const nameLine = model.header.name;
    const phoneLine = model.header.phone;
    const emailLine = model.header.email;
    const roleLine = model.header.role;
    pushParagraph(model.style === "boujee" ? nameLine.toUpperCase() : nameLine);
    pushParagraph(phoneLine);
    pushParagraph(emailLine);
    pushParagraph(roleLine);
    if (model.style === "aesthetic" || model.style === "boujee") {
      pushParagraph("----------------------------------------");
    }
  } else {
    pushParagraph(model.title);
  }

  if (model.kind === "coverLetter" && model.coverLetter) {
    const { dateLine, greeting, paragraphs: body, signOff, signature } = model.coverLetter;
    [dateLine, greeting, ...body, signOff, signature].filter(Boolean).forEach(pushParagraph);
  } else {
    model.sections.forEach((section) => {
      pushHeading(formatHeading(section.title, model.style));
      section.paragraphs.forEach(pushParagraph);
      section.bullets.forEach((bullet) => pushParagraph(`• ${bullet}`));
    });
  }

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

  const blobParts: Uint8Array[] = [];
  fileEntries.forEach((entry) => {
    blobParts.push(entry.localHeader, entry.data);
  });
  blobParts.push(...centralDirectory, endRecord);

  return new Blob(blobParts, { type: "application/zip" });
};

export const renderDocx = async (model: DocumentModel): Promise<Blob> => {
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

  const documentXml = createDocumentXml(model);

  const zip = createZip([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypes) },
    { name: "_rels/.rels", data: encoder.encode(rels) },
    { name: "word/document.xml", data: encoder.encode(documentXml) },
  ]);
  return new Blob([zip], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

export const renderPdf = (model: DocumentModel): Blob => {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const maxChars = 90;
  const style = model.style ?? "standard";
  const styleConfig = {
    standard: { nameSize: 18, roleSize: 12, headingSize: 12, bodySize: 11, lineSpacing: 15 },
    aesthetic: { nameSize: 20, roleSize: 12, headingSize: 13, bodySize: 11, lineSpacing: 16 },
    boujee: { nameSize: 22, roleSize: 13, headingSize: 13, bodySize: 11, lineSpacing: 16 },
  }[style];

  type PdfLine = { text: string; size: number; spacing: number };
  const lines: PdfLine[] = [];

  const pushLine = (text: string, size: number, spacing: number) => {
    wrapText(text, maxChars).forEach((line) => {
      lines.push({ text: line, size, spacing });
    });
  };

  if (model.kind === "cv" && model.header) {
    const nameLine = style === "boujee" ? model.header.name.toUpperCase() : model.header.name;
    pushLine(nameLine, styleConfig.nameSize, styleConfig.lineSpacing + 4);
    pushLine(model.header.phone, styleConfig.bodySize, styleConfig.lineSpacing);
    pushLine(model.header.email, styleConfig.bodySize, styleConfig.lineSpacing);
    pushLine(model.header.role, styleConfig.roleSize, styleConfig.lineSpacing);
    if (style !== "standard") {
      pushLine("--------------------------------------------------", styleConfig.bodySize, styleConfig.lineSpacing);
    }
  } else {
    pushLine(model.title, 18, 22);
  }

  if (model.kind === "coverLetter" && model.coverLetter) {
    const { dateLine, greeting, paragraphs, signOff, signature } = model.coverLetter;
    [dateLine, greeting].forEach((line) => pushLine(line, 12, 16));
    paragraphs.forEach((paragraph) => pushLine(paragraph, 12, 16));
    pushLine(signOff, 12, 16);
    if (signature) pushLine(signature, 12, 16);
  } else {
    model.sections.forEach((section) => {
      const headingText = formatHeading(section.title, style);
      pushLine(headingText, styleConfig.headingSize, styleConfig.lineSpacing + 3);
      section.paragraphs.forEach((paragraph) =>
        pushLine(paragraph, styleConfig.bodySize, styleConfig.lineSpacing)
      );
      section.bullets.forEach((bullet) =>
        pushLine(`• ${bullet}`, styleConfig.bodySize, styleConfig.lineSpacing)
      );
    });
  }

  const pages: string[] = [];
  let currentLines: PdfLine[] = [];
  let y = pageHeight - margin;

  lines.forEach((line) => {
    if (y - line.spacing < margin) {
      pages.push(currentLines.map((item) => `${item.size}|${item.spacing}|${item.text}`).join("\n"));
      currentLines = [];
      y = pageHeight - margin;
    }
    currentLines.push(line);
    y -= line.spacing;
  });
  if (currentLines.length > 0) {
    pages.push(currentLines.map((item) => `${item.size}|${item.spacing}|${item.text}`).join("\n"));
  }

  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];

  const fontObjectNumber = 3;
  const firstContentObjectNumber = 4;
  let objectNumber = firstContentObjectNumber;

  pages.forEach((page) => {
    const linesContent = page.split("\n").map((entry) => {
      const [size, spacing, ...textParts] = entry.split("|");
      const text = textParts.join("|");
      return { size: Number(size), spacing: Number(spacing), text };
    });
    let textStream = `BT /F1 12 Tf ${margin} ${pageHeight - margin} Td\n`;
    linesContent.forEach((line) => {
      textStream += `/F1 ${line.size} Tf 0 -${line.spacing} Td (${textEscape(line.text)}) Tj\n`;
    });
    textStream += "ET";
    const stream = `<< /Length ${textStream.length} >>\nstream\n${textStream}\nendstream`;
    objects.push(`${objectNumber} 0 obj\n${stream}\nendobj\n`);
    const contentRef = objectNumber;
    objectNumber += 1;
    const pageRef = objectNumber;
    pageObjectNumbers.push(pageRef);
    const pageObject = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentRef} 0 R >>`;
    objects.push(`${pageRef} 0 obj\n${pageObject}\nendobj\n`);
    objectNumber += 1;
  });

  const fontObject = `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const pagesObject = `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers
    .map((ref) => `${ref} 0 R`)
    .join(" ")}] /Count ${pageObjectNumbers.length} >>\nendobj\n`;
  const catalogObject = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

  const pdfBody = `${catalogObject}${pagesObject}${fontObject}${objects.join("")}`;
  const header = "%PDF-1.4\n";
  const encoder = new TextEncoder();
  const byteLength = (value: string) => encoder.encode(value).length;
  const offsets: number[] = [];
  let runningOffset = byteLength(header);
  offsets.push(runningOffset);
  runningOffset += byteLength(catalogObject);
  offsets.push(runningOffset);
  runningOffset += byteLength(pagesObject);
  offsets.push(runningOffset);
  runningOffset += byteLength(fontObject);
  objects.forEach((object) => {
    offsets.push(runningOffset);
    runningOffset += byteLength(object);
  });

  const xrefEntries = ["0000000000 65535 f "];
  offsets.forEach((offset) => {
    xrefEntries.push(`${offset.toString().padStart(10, "0")} 00000 n `);
  });

  const totalObjects = 3 + objects.length;
  const xrefOffset = byteLength(header + pdfBody);

  const pdf = `${header}${pdfBody}xref\n0 ${totalObjects + 1}\n${xrefEntries.join(
    "\n"
  )}\ntrailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};
