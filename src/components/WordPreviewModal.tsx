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
import { StandardTemplate } from "@/templates/StandardTemplate";
import { AestheticTemplate } from "@/templates/AestheticTemplate";
import { SignatureTemplate } from "@/templates/SignatureTemplate";
import type { CVStyle, DocumentHeader } from "@/types";
import type { CVData, CVTheme } from "@/types/cv";

interface WordPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  header: DocumentHeader;
  cvStyle: CVStyle;
}

const defaultTheme: CVTheme = {
  primary: "#1f3a5f",
  primaryContrast: "#ffffff",
  primaryLight: "#d6e2f2",
  sidebar: "#eef1f4",
  sidebarText: "#1f2937",
  border: "#cbd5e1",
  muted: "#6b7280",
};

const renderTemplate = (data: CVData, style: CVStyle) => {
  switch (style) {
    case "aesthetic":
      return <AestheticTemplate data={data} theme={defaultTheme} />;
    case "signature":
      return <SignatureTemplate data={data} theme={defaultTheme} />;
    default:
      return <StandardTemplate data={data} theme={defaultTheme} />;
  }
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
          <div
            className="mx-auto bg-white"
            style={{
              width: "210mm",
              minHeight: "297mm",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            {renderTemplate(data, cvStyle)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
