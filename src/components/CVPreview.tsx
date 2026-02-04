import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardTemplate } from "@/templates/StandardTemplate";
import { AestheticTemplate } from "@/templates/AestheticTemplate";
import { SignatureTemplate } from "@/templates/SignatureTemplate";
import { sampleCVData, type CVData } from "@/types/cv";
import type { CVStyle } from "@/types";
import { exportToDOCX } from "@/utils/exportToDOCX";
import { exportToPDF } from "@/utils/exportToPDF";
import { toast } from "@/hooks/use-toast";

interface CVPreviewProps {
  data?: CVData;
  selectedTemplate: CVStyle;
  onTemplateChange: (template: CVStyle) => void;
}

export const CVPreview = ({ 
  data = sampleCVData, 
  selectedTemplate, 
  onTemplateChange 
}: CVPreviewProps) => {
  const [isExporting, setIsExporting] = useState(false);

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

  const handleDownload = async (format: "docx" | "pdf") => {
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
        return <AestheticTemplate data={data} />;
      case "signature":
        return <SignatureTemplate data={data} />;
      default:
        return <StandardTemplate data={data} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            }`}
            onClick={() => onTemplateChange(template.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </CardContent>
          </Card>
        ))}
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

      {/* CV Preview */}
      <motion.div
        key={selectedTemplate}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-auto rounded-lg border border-border shadow-lg bg-white"
        style={{ maxHeight: "80vh" }}
      >
        <div 
          id="cv-preview" 
          className="origin-top-left"
          style={{ 
            transform: "scale(0.6)", 
            transformOrigin: "top center",
            width: "210mm",
            margin: "0 auto"
          }}
        >
          {renderTemplate()}
        </div>
      </motion.div>
    </div>
  );
};
