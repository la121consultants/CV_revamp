import type { DocumentModel } from "@/types";

const xmlEscape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sanitise text for safe use inside a PDF Type1 font text stream.
 *  Replaces common Unicode chars with ASCII equivalents so headings stay readable. */
const sanitiseForPdf = (text: string) =>
  text
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "*")
    .replace(/[\u00A0]/g, " ")
    .replace(/[^\x20-\x7E]/g, ""); // strip remaining non-ASCII

const textEscape = (text: string) =>
  sanitiseForPdf(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

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
  if (style === "signature") {
    return text.toUpperCase();
  }
  if (style === "aesthetic") {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return text.toUpperCase();
};

const createDocumentXml = (model: DocumentModel) => {
  const paragraphs: string[] = [];
  const style = model.style ?? "standard";

  const pushParagraph = (text: string, opts?: { bold?: boolean; size?: number; alignment?: string; spacing?: number }) => {
    const sz = opts?.size ?? 22; // 11pt default (half-points)
    const bold = opts?.bold ? "<w:b/>" : "";
    const jc = opts?.alignment ? `<w:jc w:val="${opts.alignment}"/>` : "";
    const spacingAfter = opts?.spacing ?? 120;
    paragraphs.push(
      `<w:p><w:pPr>${jc}<w:spacing w:after="${spacingAfter}" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`
    );
  };

  const pushHeading = (text: string) => {
    paragraphs.push(
      `<w:p><w:pPr><w:spacing w:before="240" w:after="80" w:line="276" w:lineRule="auto"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="999999"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:color w:val="333333"/></w:rPr><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`
    );
  };

  const pushBullet = (text: string) => {
    paragraphs.push(
      `<w:p><w:pPr><w:spacing w:after="60" w:line="276" w:lineRule="auto"/><w:ind w:left="360" w:hanging="180"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/></w:rPr><w:t xml:space="preserve">${xmlEscape("• " + text)}</w:t></w:r></w:p>`
    );
  };

  if (model.kind === "cv" && model.header) {
    const nameLine = style === "signature" ? model.header.name.toUpperCase() : model.header.name;
    pushParagraph(nameLine, { bold: true, size: style === "signature" ? 36 : style === "aesthetic" ? 34 : 30, alignment: "center", spacing: 40 });
    const contactParts = [model.header.email, model.header.phone, model.header.location, model.header.linkedin].filter(Boolean);
    pushParagraph(contactParts.join("  |  "), { size: 20, alignment: "center", spacing: 40 });
    pushParagraph(model.header.role, { bold: true, size: 24, alignment: "center", spacing: 200 });
  } else {
    pushParagraph(model.title, { bold: true, size: 28, alignment: "center", spacing: 200 });
  }

  if (model.kind === "coverLetter" && model.coverLetter) {
    const { dateLine, greeting, paragraphs: body, signOff, signature } = model.coverLetter;
    [dateLine, greeting, ...body, signOff, signature].filter(Boolean).forEach((t) => pushParagraph(t));
  } else {
    model.sections.forEach((section) => {
      pushHeading(formatHeading(section.title, style));
      section.paragraphs.forEach((p) => pushParagraph(p));
      section.bullets.forEach((bullet) => pushBullet(bullet));
    });
  }

  // A4 page size: 11906 twips wide × 16838 twips tall, 20mm margins ≈ 1134 twips
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" />
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0" />
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
  // A4 in points: 595 × 842
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 57; // ~20mm
  const maxChars = 85;
  const style = model.style ?? "standard";
  const styleConfig = {
    standard: { nameSize: 16, roleSize: 12, headingSize: 12, bodySize: 10.5, lineSpacing: 14, bulletIndent: 12 },
    aesthetic: { nameSize: 18, roleSize: 12, headingSize: 12, bodySize: 10.5, lineSpacing: 14, bulletIndent: 12 },
    signature: { nameSize: 20, roleSize: 13, headingSize: 12, bodySize: 10.5, lineSpacing: 14, bulletIndent: 12 },
  }[style];

  type PdfLine = { text: string; size: number; spacing: number };
  const lines: PdfLine[] = [];

  const pushLine = (text: string, size: number, spacing: number) => {
    wrapText(text, maxChars).forEach((line) => {
      lines.push({ text: line, size, spacing });
    });
  };

  if (model.kind === "cv" && model.header) {
    const nameLine = style === "signature" ? model.header.name.toUpperCase() : model.header.name;
    pushLine(nameLine, styleConfig.nameSize, styleConfig.lineSpacing + 6);
    const contactParts = [model.header.email, model.header.phone, model.header.location, model.header.linkedin].filter(Boolean);
    pushLine(contactParts.join("  |  "), styleConfig.bodySize, styleConfig.lineSpacing);
    pushLine(model.header.role, styleConfig.roleSize, styleConfig.lineSpacing + 4);
    lines.push({ text: "", size: 1, spacing: 8 }); // spacer
  } else {
    pushLine(model.title, 16, 20);
  }

  if (model.kind === "coverLetter" && model.coverLetter) {
    const { dateLine, greeting, paragraphs, signOff, signature } = model.coverLetter;
    [dateLine, greeting].forEach((line) => pushLine(line, 11, 15));
    paragraphs.forEach((paragraph) => pushLine(paragraph, 11, 15));
    pushLine(signOff, 11, 15);
    if (signature) pushLine(signature, 11, 15);
  } else {
    model.sections.forEach((section) => {
      lines.push({ text: "", size: 1, spacing: 6 }); // section gap
      const headingText = formatHeading(section.title, style);
      pushLine(headingText, styleConfig.headingSize, styleConfig.lineSpacing + 4);
      section.paragraphs.forEach((paragraph) =>
        pushLine(paragraph, styleConfig.bodySize, styleConfig.lineSpacing)
      );
      section.bullets.forEach((bullet) =>
        pushLine(`  • ${bullet}`, styleConfig.bodySize, styleConfig.lineSpacing)
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
