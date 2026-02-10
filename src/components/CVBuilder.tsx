import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CVPreview } from "@/components/CVPreview";
import { emptyCVData } from "@/utils/parseCVData";
import type { CVStyle } from "@/types";

interface CVBuilderProps {
  onBack: () => void;
}

export const CVBuilder = ({ onBack }: CVBuilderProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CVStyle>("standard");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            CV Builder
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from three professionally designed templates. Each exports cleanly to PDF and Word format.
          </p>
        </motion.div>

        {/* CV Preview Component */}
        <CVPreview
          data={emptyCVData}
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
        />
      </div>
    </div>
  );
};

export default CVBuilder;
