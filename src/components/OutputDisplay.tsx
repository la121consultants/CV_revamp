import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Mail, Copy, Check, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { CVPreview } from "@/components/CVPreview";
import { parseCVDataFromMarkdown } from "@/utils/parseCVData";
import type { CVStyle, DocumentHeader, TailoredOutput, OutputType } from "@/types";
import { renderDocumentRequest, downloadDocumentRequest } from "@/lib/documentApi";
import { toast } from "@/hooks/use-toast";
import { WordPreviewModal } from "@/components/WordPreviewModal";
import { CareerSupportCTA } from "@/components/CareerSupportCTA";

interface OutputDisplayProps {
  output: TailoredOutput;
  outputType: OutputType;
  header: DocumentHeader;
  cvStyle: CVStyle;
  onStyleChange: (style: CVStyle) => void;
  canDownload?: boolean;
  onDownloadBlocked?: () => void;
}

export const OutputDisplay = ({
  output,
  outputType,
  header,
  cvStyle,
  onStyleChange,
  canDownload = false,
  onDownloadBlocked,
}: OutputDisplayProps) => {
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [showWordPreview, setShowWordPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState<{ cv: boolean; letter: boolean }>({
    cv: false,
    letter: false,
  });

  const handleCopy = async (text: string, type: "cv" | "letter") => {
    await navigator.clipboard.writeText(text);
    if (type === "cv") {
      return;
    } else {
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (
    content: string,
    kind: "cv" | "coverLetter",
    format: "docx" | "pdf"
  ) => {
    if (!canDownload) {
      onDownloadBlocked?.();
      return;
    }
    const target = kind === "cv" ? "cv" : "letter";
    try {
      setIsDownloading((prev) => ({ ...prev, [target]: true }));
      const rendered = await renderDocumentRequest(
        content,
        kind,
        format,
        kind === "cv" ? header : undefined,
        kind === "cv" ? cvStyle : undefined
      );
      const cached = downloadDocumentRequest(rendered.id, format);
      triggerDownload(cached.blob, cached.fileName);
    } catch (error) {
      console.error(error);
      toast({
        title: "Download failed",
        description: "Unable to generate the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading((prev) => ({ ...prev, [target]: false }));
    }
  };

  const showCV = outputType === "cv" || outputType === "both";
  const showLetter = outputType === "coverLetter" || outputType === "both";

  const defaultTab = showCV ? "cv" : "coverLetter";

  const previewData = useMemo(() => {
    return parseCVDataFromMarkdown(output.cv, {
      name: header.name,
      role: header.role,
      email: header.email,
      phone: header.phone,
      city: header.location,
      linkedin: header.linkedin,
    });
  }, [output.cv, header]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
    >
      <Tabs defaultValue={defaultTab} className="w-full">
        {outputType === 'both' && (
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/50 p-0 h-auto">
            <TabsTrigger 
              value="cv"
              className="flex items-center gap-2 px-6 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <FileText className="w-4 h-4" />
              Tailored CV
            </TabsTrigger>
            <TabsTrigger 
              value="coverLetter"
              className="flex items-center gap-2 px-6 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Mail className="w-4 h-4" />
              Cover Letter
            </TabsTrigger>
          </TabsList>
        )}

        <AnimatePresence mode="wait">
          {showCV && (
            <TabsContent value="cv" className="m-0">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Your Tailored CV
                    </h3>
                  </div>
                </div>
                <CVPreview
                  data={previewData}
                  selectedTemplate={cvStyle}
                  onTemplateChange={onStyleChange}
                  canDownload={canDownload}
                  onDownloadBlocked={onDownloadBlocked}
                />
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWordPreview(true)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview as Word
                  </Button>
                </div>
                <WordPreviewModal
                  open={showWordPreview}
                  onOpenChange={setShowWordPreview}
                  content={output.cv}
                  header={header}
                  cvStyle={cvStyle}
                />
              </div>
            </TabsContent>
          )}

          {showLetter && (
            <TabsContent value="coverLetter" className="m-0">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Your Cover Letter
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(output.coverLetter, 'letter')}
                    >
                      {copiedLetter ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copiedLetter ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(output.coverLetter, "coverLetter", "docx")}
                      disabled={isDownloading.letter}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Word
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(output.coverLetter, "coverLetter", "pdf")}
                      disabled={isDownloading.letter}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none bg-muted/30 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                  <ReactMarkdown>{output.coverLetter}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>

      <CareerSupportCTA compact />
    </motion.div>
  );
};
