import { renderDocument, getCachedDocument } from "@/lib/documents";
import { getSessionId } from "@/lib/session";
import type { CVStyle, DocumentHeader, DocumentKind, DocumentRenderFormat } from "@/types";

export const renderDocumentRequest = async (
  rawText: string,
  kind: DocumentKind,
  format: DocumentRenderFormat,
  header?: DocumentHeader,
  style?: CVStyle
) => {
  const ownerId = getSessionId();
  return renderDocument(ownerId, rawText, kind, format, header, style);
};

export const downloadDocumentRequest = (
  documentId: string,
  format: DocumentRenderFormat
) => {
  const ownerId = getSessionId();
  const cached = getCachedDocument(ownerId, documentId, format);
  if (!cached) {
    throw new Error("Document not found or expired.");
  }
  return cached;
};
