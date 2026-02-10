import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildDocumentModel } from "@/lib/documentModel";
import type { CVStyle, DocumentHeader, DocumentModel } from "@/types";

interface WordPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  header: DocumentHeader;
  cvStyle: CVStyle;
}

const formatHeading = (text: string, style?: string) => {
  if (style === "aesthetic") return text.replace(/\b\w/g, (c) => c.toUpperCase());
  return text.toUpperCase();
};

const RenderPage = ({ model }: { model: DocumentModel }) => {
  const style = model.style ?? "standard";

  return (
    <div
      className="bg-white mx-auto mb-8 relative"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)",
        fontFamily: "Helvetica, Arial, sans-serif",
        color: "#1a1a1a",
        lineHeight: 1.4,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      {model.header && (
        <div
          style={{
            textAlign: style === "signature" ? "left" : "center",
            marginBottom: "16pt",
            borderBottom: style === "signature" ? "2px solid #333" : style === "aesthetic" ? "2px solid #2563eb" : "1px solid #999",
            paddingBottom: "10pt",
          }}
        >
          <div
            style={{
              fontSize: style === "signature" ? "22pt" : style === "aesthetic" ? "20pt" : "18pt",
              fontWeight: 700,
              letterSpacing: style === "signature" ? "1px" : "0",
              textTransform: style === "signature" ? "uppercase" : "none",
              marginBottom: "4pt",
            }}
          >
            {model.header.name}
          </div>
          <div style={{ fontSize: "11pt", marginBottom: "2pt" }}>{model.header.phone}</div>
          <div style={{ fontSize: "11pt", marginBottom: "2pt" }}>{model.header.email}</div>
          <div
            style={{
              fontSize: style === "signature" ? "13pt" : "12pt",
              fontWeight: 500,
              marginTop: "4pt",
            }}
          >
            {model.header.role}
          </div>
        </div>
      )}

      {/* Sections */}
      {model.sections.map((section, i) => (
        <div key={i} style={{ marginBottom: "12pt" }}>
          <div
            style={{
              fontSize: style === "signature" ? "13pt" : style === "aesthetic" ? "13pt" : "12pt",
              fontWeight: 700,
              textTransform: style === "aesthetic" ? "capitalize" : "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3pt",
              marginBottom: "6pt",
              color: style === "aesthetic" ? "#2563eb" : "#333",
            }}
          >
            {formatHeading(section.title, style)}
          </div>
          {section.paragraphs.map((p, j) => (
            <p key={j} style={{ fontSize: "11pt", margin: "0 0 4pt 0" }}>
              {p}
            </p>
          ))}
          {section.bullets.map((b, j) => (
            <p key={`b-${j}`} style={{ fontSize: "11pt", margin: "0 0 3pt 14pt" }}>
              • {b}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

export const WordPreviewModal = ({
  open,
  onOpenChange,
  content,
  header,
  cvStyle,
}: WordPreviewModalProps) => {
  const model = useMemo(
    () => buildDocumentModel(content, "cv", header, cvStyle),
    [content, header, cvStyle]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-[95vw] h-[92vh] p-0 overflow-hidden flex flex-col"
        style={{ maxWidth: "95vw" }}
      >
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">
            Word Document Preview — A4
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div
          className="flex-1 overflow-auto"
          style={{
            background: "#e5e7eb",
            padding: "32px 0",
          }}
        >
          <div style={{ width: "fit-content", margin: "0 auto" }}>
            <RenderPage model={model} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
