import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseCVDataFromMarkdown } from "@/utils/parseCVData";
import type { CVStyle, DocumentHeader } from "@/types";
import type { CVData } from "@/types/cv";

interface WordPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  header: DocumentHeader;
  cvStyle: CVStyle;
}

const RenderPage = ({ data, style }: { data: CVData; style: CVStyle }) => {
  const fontFamily = "Calibri, 'Segoe UI', Arial, Helvetica, sans-serif";
  const { personal, skills, experience, education, projects } = data;

  const formatHeading = (text: string) => {
    if (style === "aesthetic") return text.replace(/\b\w/g, (c) => c.toUpperCase());
    return text.toUpperCase();
  };

  const contactParts = [personal.email, personal.phone, personal.location, personal.linkedin].filter(Boolean);

  return (
    <div
      className="bg-white mx-auto mb-8 relative"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)",
        fontFamily,
        color: "#1a1a1a",
        lineHeight: 1.5,
        boxSizing: "border-box",
        fontSize: "10.5pt",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "18pt",
          paddingBottom: "12pt",
          borderBottom: "1px solid #999",
        }}
      >
        <div
          style={{
            fontSize: style === "signature" ? "18pt" : style === "aesthetic" ? "17pt" : "15pt",
            fontWeight: 700,
            letterSpacing: style === "signature" ? "1px" : "0",
            textTransform: style === "signature" ? "uppercase" : "none",
            marginBottom: "4pt",
          }}
        >
          {personal.firstName} {personal.lastName}
        </div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: "10pt", marginBottom: "2pt", color: "#444" }}>
            {contactParts.join("  |  ")}
          </div>
        )}
        {personal.title && (
          <div style={{ fontSize: "12pt", fontWeight: 600, marginTop: "6pt" }}>
            {personal.title}
          </div>
        )}
      </div>

      {/* Professional Summary */}
      {personal.summary && (
        <div style={{ marginBottom: "10pt" }}>
          <div
            style={{
              fontSize: "12pt",
              fontWeight: 700,
              textTransform: style === "aesthetic" ? "capitalize" : "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3pt",
              marginBottom: "5pt",
              color: "#333",
            }}
          >
            {formatHeading("Professional Summary")}
          </div>
          <p style={{ fontSize: "10.5pt", margin: "0 0 4pt 0", fontWeight: 400 }}>
            {personal.summary}
          </p>
        </div>
      )}

      {/* Key Skills */}
      {skills.length > 0 && (
        <div style={{ marginBottom: "10pt" }}>
          <div
            style={{
              fontSize: "12pt",
              fontWeight: 700,
              textTransform: style === "aesthetic" ? "capitalize" : "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3pt",
              marginBottom: "5pt",
              color: "#333",
            }}
          >
            {formatHeading("Key Skills")}
          </div>
          {skills.map((skill, i) => (
            <p key={i} style={{ fontSize: "10.5pt", margin: "0 0 3pt 18pt", fontWeight: 400 }}>
              • {skill.name}
            </p>
          ))}
        </div>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <div style={{ marginBottom: "10pt" }}>
          <div
            style={{
              fontSize: "12pt",
              fontWeight: 700,
              textTransform: style === "aesthetic" ? "capitalize" : "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3pt",
              marginBottom: "5pt",
              color: "#333",
            }}
          >
            {formatHeading("Work Experience")}
          </div>
          {experience.map((item, i) => (
            <div key={i} style={{ marginBottom: "8pt" }}>
              <p style={{ fontSize: "10.5pt", fontWeight: 700, margin: "0 0 2pt 0" }}>
                {item.role} — {item.company}{item.location ? ` (${item.location})` : ""}
              </p>
              <p style={{ fontSize: "10pt", margin: "0 0 3pt 0", color: "#555" }}>
                {item.startDate} – {item.endDate}
              </p>
              {item.bullets.map((b, j) => (
                <p key={j} style={{ fontSize: "10.5pt", margin: "0 0 3pt 18pt", fontWeight: 400 }}>
                  • {b}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div style={{ marginBottom: "10pt" }}>
          <div
            style={{
              fontSize: "12pt",
              fontWeight: 700,
              textTransform: style === "aesthetic" ? "capitalize" : "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3pt",
              marginBottom: "5pt",
              color: "#333",
            }}
          >
            {formatHeading("Education")}
          </div>
          {education.map((item, i) => (
            <div key={i} style={{ marginBottom: "6pt" }}>
              <p style={{ fontSize: "10.5pt", fontWeight: 700, margin: "0 0 2pt 0" }}>
                {item.qualification} — {item.institution}
              </p>
              {(item.startDate || item.endDate) && (
                <p style={{ fontSize: "10pt", margin: "0 0 2pt 0", color: "#555" }}>
                  {item.startDate} – {item.endDate}
                </p>
              )}
              {item.details && item.details.map((d, j) => (
                <p key={j} style={{ fontSize: "10.5pt", margin: "0 0 3pt 18pt", fontWeight: 400 }}>
                  • {d}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{ marginBottom: "10pt" }}>
          <div
            style={{
              fontSize: "12pt",
              fontWeight: 700,
              textTransform: style === "aesthetic" ? "capitalize" : "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3pt",
              marginBottom: "5pt",
              color: "#333",
            }}
          >
            {formatHeading("Projects")}
          </div>
          {projects.map((project, i) => (
            <div key={i} style={{ marginBottom: "6pt" }}>
              <p style={{ fontSize: "10.5pt", fontWeight: 700, margin: "0 0 2pt 0" }}>
                {project.title}
              </p>
              {project.description && (
                <p style={{ fontSize: "10.5pt", margin: "0 0 2pt 0" }}>{project.description}</p>
              )}
              {project.contribution && (
                <p style={{ fontSize: "10.5pt", margin: "0 0 2pt 0", fontStyle: "italic" }}>{project.contribution}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* References */}
      <div style={{ marginBottom: "10pt" }}>
        <div
          style={{
            fontSize: "12pt",
            fontWeight: 700,
            textTransform: style === "aesthetic" ? "capitalize" : "uppercase",
            letterSpacing: "0.5px",
            borderBottom: "1px solid #ccc",
            paddingBottom: "3pt",
            marginBottom: "5pt",
            color: "#333",
          }}
        >
          {formatHeading("References")}
        </div>
        <p style={{ fontSize: "10.5pt", margin: "0", fontWeight: 400 }}>
          References available on request
        </p>
      </div>
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
  const data = useMemo(
    () =>
      parseCVDataFromMarkdown(content, {
        name: header.name,
        role: header.role,
        email: header.email,
        phone: header.phone,
        city: header.location,
        linkedin: header.linkedin,
      }),
    [content, header]
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
          style={{ background: "#e5e7eb", padding: "32px 0" }}
        >
          <div style={{ width: "fit-content", margin: "0 auto" }}>
            <RenderPage data={data} style={cvStyle} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
