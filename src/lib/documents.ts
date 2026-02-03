import { buildDocumentModel } from "@/lib/documentModel";
import { renderDocx, renderPdf } from "@/lib/documentRenderer";
import type {
  DocumentKind,
  DocumentModel,
  DocumentRenderFormat,
  RenderedDocument,
} from "@/types";

const MAX_RAW_TEXT_SIZE = 20000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 12;

const documentCache = new Map<string, RenderedDocument>();

const toCacheKey = (ownerId: string, kind: DocumentKind, format: DocumentRenderFormat, rawText: string) =>
  `${ownerId}:${kind}:${format}:${rawText}`;

const purgeCache = () => {
  const now = Date.now();
  for (const [key, value] of documentCache.entries()) {
    if (now - value.createdAt > CACHE_TTL_MS) {
      documentCache.delete(key);
    }
  }
  if (documentCache.size <= MAX_CACHE_ENTRIES) return;
  const entries = Array.from(documentCache.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
  entries.slice(0, documentCache.size - MAX_CACHE_ENTRIES).forEach(([key]) => documentCache.delete(key));
};

const ensureSafeText = (text: string) => {
  if (!text.trim()) {
    throw new Error("Document content is empty.");
  }
  if (text.length > MAX_RAW_TEXT_SIZE) {
    throw new Error("Document content is too large.");
  }
};

export const renderDocument = async (
  ownerId: string,
  rawText: string,
  kind: DocumentKind,
  format: DocumentRenderFormat
): Promise<RenderedDocument> => {
  ensureSafeText(rawText);
  purgeCache();

  const cacheKey = toCacheKey(ownerId, kind, format, rawText);
  const existing = documentCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const model: DocumentModel = buildDocumentModel(rawText, kind);
  model.id = crypto.randomUUID();

  const blob = format === "docx" ? await renderDocx(model) : renderPdf(model);
  const fileName = `${kind === "cv" ? "tailored-cv" : "cover-letter"}.${format}`;

  const rendered: RenderedDocument = {
    id: model.id,
    ownerId,
    format,
    fileName,
    blob,
    createdAt: Date.now(),
    cacheKey,
  };

  documentCache.set(cacheKey, rendered);
  return rendered;
};

export const getCachedDocument = (ownerId: string, id: string, format: DocumentRenderFormat) => {
  for (const document of documentCache.values()) {
    if (document.ownerId === ownerId && document.id === id && document.format === format) {
      return document;
    }
  }
  return null;
};
