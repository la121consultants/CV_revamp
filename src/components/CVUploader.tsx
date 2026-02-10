import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CVData } from "@/types";

interface CVUploaderProps {
  onUpload: (cvData: CVData) => void;
  cvData: CVData | null;
  onClear: () => void;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export const CVUploader = ({ onUpload, cvData, onClear }: CVUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const fileType: CVData['fileType'] = ext === 'pdf' ? 'pdf' 
        : (ext === 'docx' || ext === 'doc') ? 'docx' 
        : 'txt';
      
      let content = '';

      if (fileType === 'pdf') {
        content = await extractTextFromPDF(file);
      } else if (fileType === 'docx') {
        content = await extractTextFromDOCX(file);
      } else {
        content = await file.text();
      }

      if (!content || content.trim().length < 20) {
        toast({
          title: "Could not extract text",
          description: "The file appears empty or unreadable. Try pasting your CV text instead.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      onUpload({
        fileName: file.name,
        content,
        fileType,
      });

      toast({
        title: "CV uploaded successfully",
        description: `Extracted ${content.split(/\s+/).length} words from ${file.name}`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Upload failed",
        description: "Could not read the file. Please try a different format or paste your CV text.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  if (cvData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-xl bg-success/10 border-2 border-success"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">{cvData.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {cvData.fileType.toUpperCase()} • {cvData.content.split(/\s+/).length} words extracted • Ready to process
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative p-8 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
        ${isDragOver 
          ? 'border-primary bg-primary-light' 
          : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary-light/50'
        }
      `}
    >
      <input
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center text-center">
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
          ${isDragOver ? 'bg-primary text-primary-foreground' : 'bg-primary-light text-primary'}
        `}>
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-7 h-7" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isProcessing ? 'Extracting text from your CV...' : 'Upload Your CV'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop or click to browse
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>PDF, DOCX, or TXT (Max 10MB)</span>
        </div>
      </div>
    </motion.div>
  );
};
