import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardTemplate } from "@/templates/StandardTemplate";
import { AestheticTemplate } from "@/templates/AestheticTemplate";
import { SignatureTemplate } from "@/templates/SignatureTemplate";
import { type CVData, type CVTheme } from "@/types/cv";
import { emptyCVData } from "@/utils/parseCVData";
import type { CVStyle } from "@/types";
import { exportToDOCX } from "@/utils/exportToDOCX";
import { exportToPDF } from "@/utils/exportToPDF";
import { toast } from "@/hooks/use-toast";

interface CVPreviewProps {
  data?: CVData;
  selectedTemplate: CVStyle;
  onTemplateChange: (template: CVStyle) => void;
  canDownload?: boolean;
  onDownloadBlocked?: () => void;
}

export const CVPreview = ({ 
  data = emptyCVData, 
  selectedTemplate, 
  onTemplateChange,
  canDownload = false,
  onDownloadBlocked,
}: CVPreviewProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("classic-blue");

  const templates: { id: CVStyle; name: string; description: string }[] = [
    { 
      id: "standard", 
      name: "Standard", 
      description: "Traditional single-column layout. ATS-friendly, corporate-ready." 
    },
    { 
      id: "aesthetic", 
      name: "Aesthetic", 
      description: "Modern two-column with blue accents. Clean and professional." 
    },
    { 
      id: "signature", 
      name: "Signature", 
      description: "Premium executive layout. Polished with subtle sophistication." 
    },
  ];

  const themes: { id: string; name: string; theme: CVTheme; swatch: string[] }[] = [
    {
      id: "classic-blue",
      name: "Classic Blue",
      theme: {
        primary: "#1f3a5f",
        primaryContrast: "#ffffff",
        primaryLight: "#d6e2f2",
        sidebar: "#eef1f4",
        sidebarText: "#1f2937",
        border: "#cbd5e1",
        muted: "#6b7280",
      },
      swatch: ["#1f3a5f", "#eef1f4", "#d6e2f2"],
    },
    {
      id: "deep-navy",
      name: "Deep Navy",
      theme: {
        primary: "#0f2a4a",
        primaryContrast: "#ffffff",
        primaryLight: "#dbe7f5",
        sidebar: "#e8edf4",
        sidebarText: "#111827",
        border: "#c7d2e5",
        muted: "#64748b",
      },
      swatch: ["#0f2a4a", "#e8edf4", "#dbe7f5"],
    },
    {
      id: "emerald",
      name: "Emerald",
      theme: {
        primary: "#0f766e",
        primaryContrast: "#ffffff",
        primaryLight: "#ccfbf1",
        sidebar: "#ecfdf5",
        sidebarText: "#0f172a",
        border: "#99f6e4",
        muted: "#64748b",
      },
      swatch: ["#0f766e", "#ecfdf5", "#ccfbf1"],
    },
    {
      id: "slate",
      name: "Slate",
      theme: {
        primary: "#334155",
        primaryContrast: "#ffffff",
        primaryLight: "#e2e8f0",
        sidebar: "#f1f5f9",
        sidebarText: "#0f172a",
        border: "#cbd5e1",
        muted: "#64748b",
      },
      swatch: ["#334155", "#f1f5f9", "#e2e8f0"],
    },
    {
      id: "royal-purple",
      name: "Royal Purple",
      theme: {
        primary: "#5b21b6",
        primaryContrast: "#ffffff",
        primaryLight: "#e9d5ff",
        sidebar: "#f5f3ff",
        sidebarText: "#1f2937",
        border: "#c4b5fd",
        muted: "#6b7280",
      },
      swatch: ["#5b21b6", "#f5f3ff", "#e9d5ff"],
    },
    {
      id: "copper",
      name: "Copper",
      theme: {
        primary: "#9a3412",
        primaryContrast: "#ffffff",
        primaryLight: "#fed7aa",
        sidebar: "#fff7ed",
        sidebarText: "#3f1d0b",
        border: "#fdba74",
        muted: "#7c2d12",
      },
      swatch: ["#9a3412", "#fff7ed", "#fed7aa"],
    },
    {
      id: "rose",
      name: "Rose",
      theme: {
        primary: "#be123c",
        primaryContrast: "#ffffff",
        primaryLight: "#fecdd3",
        sidebar: "#fff1f2",
        sidebarText: "#3f0f1f",
        border: "#fda4af",
        muted: "#9f1239",
      },
      swatch: ["#be123c", "#fff1f2", "#fecdd3"],
    },
    {
      id: "teal",
      name: "Teal",
      theme: {
        primary: "#0f766e",
        primaryContrast: "#ffffff",
        primaryLight: "#ccfbf1",
        sidebar: "#f0fdfa",
        sidebarText: "#0f172a",
        border: "#5eead4",
        muted: "#64748b",
      },
      swatch: ["#0f766e", "#f0fdfa", "#ccfbf1"],
    },
    {
      id: "forest",
      name: "Forest",
      theme: {
        primary: "#166534",
        primaryContrast: "#ffffff",
        primaryLight: "#bbf7d0",
        sidebar: "#f0fdf4",
        sidebarText: "#0f172a",
        border: "#86efac",
        muted: "#4b5563",
      },
      swatch: ["#166534", "#f0fdf4", "#bbf7d0"],
    },
    {
      id: "graphite",
      name: "Graphite",
      theme: {
        primary: "#1f2937",
        primaryContrast: "#f8fafc",
        primaryLight: "#e2e8f0",
        sidebar: "#f8fafc",
        sidebarText: "#111827",
        border: "#cbd5e1",
        muted: "#64748b",
      },
      swatch: ["#1f2937", "#f8fafc", "#e2e8f0"],
    },
  ];

  const activeTheme = themes.find((theme) => theme.id === selectedThemeId) ?? themes[0];

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!canDownload) {
      onDownloadBlocked?.();
      return;
    }
    setIsExporting(true);
    try {
      if (format === "docx") {
        await exportToDOCX(data, selectedTemplate);
      } else {
        await exportToPDF("cv-preview");
      }
      toast({
        title: "Download started",
        description: `Your CV is being downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Download failed",
        description: "There was an error exporting your CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case "aesthetic":
        return <AestheticTemplate data={data} theme={activeTheme.theme} />;
      case "signature":
        return <SignatureTemplate data={data} theme={activeTheme.theme} />;
      default:
        return <StandardTemplate data={data} theme={activeTheme.theme} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="space-y-3">
        <Tabs value={selectedTemplate} onValueChange={(value) => onTemplateChange(value as CVStyle)}>
          <TabsList className="w-full flex flex-wrap gap-2 bg-muted/50">
            {templates.map((template) => (
              <TabsTrigger
                key={template.id}
                value={template.id}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {template.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {templates.find((template) => template.id === selectedTemplate)?.description}
        </p>
      </div>

      {/* Color Palette */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Color Palette</span>
          <span className="text-xs text-muted-foreground">
            {activeTheme.name}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setSelectedThemeId(theme.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                selectedThemeId === theme.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="flex items-center gap-1">
                {theme.swatch.map((color) => (
                  <span
                    key={color}
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="text-muted-foreground">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload("docx")}
          disabled={isExporting}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Download Word
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload("pdf")}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* CV Preview — A4 page fitted into container, scrollable & zoomable */}
      <motion.div
        key={selectedTemplate}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-border shadow-lg bg-muted/30 overflow-auto"
        style={{ maxHeight: "80vh" }}
      >
        <div
          id="cv-preview"
          className="origin-top-left mx-auto bg-white shadow-md"
          style={{
            width: "210mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            overflow: "hidden",
            transform: "scale(0.5)",
            transformOrigin: "top left",
            marginBottom: "-148.5mm",
            marginRight: "-105mm",
          }}
        >
          {renderTemplate()}
        </div>
      </motion.div>
    </div>
  );
};
