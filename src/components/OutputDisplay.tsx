import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Mail, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import type { TailoredOutput, OutputType } from "@/types";

interface OutputDisplayProps {
  output: TailoredOutput;
  outputType: OutputType;
}

export const OutputDisplay = ({ output, outputType }: OutputDisplayProps) => {
  const [copiedCV, setCopiedCV] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const handleCopy = async (text: string, type: 'cv' | 'letter') => {
    await navigator.clipboard.writeText(text);
    if (type === 'cv') {
      setCopiedCV(true);
      setTimeout(() => setCopiedCV(false), 2000);
    } else {
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showCV = outputType === 'cv' || outputType === 'both';
  const showLetter = outputType === 'coverLetter' || outputType === 'both';

  const defaultTab = showCV ? 'cv' : 'coverLetter';

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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Your Tailored CV
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(output.cv, 'cv')}
                    >
                      {copiedCV ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copiedCV ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(output.cv, 'tailored-cv.txt')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none bg-muted/30 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                  <ReactMarkdown>{output.cv}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}

          {showLetter && (
            <TabsContent value="coverLetter" className="m-0">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Your Cover Letter
                  </h3>
                  <div className="flex gap-2">
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
                      onClick={() => handleDownload(output.coverLetter, 'cover-letter.txt')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
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
    </motion.div>
  );
};
