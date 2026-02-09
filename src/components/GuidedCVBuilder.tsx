import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SuggestionBlock } from "./SuggestionBlock";
import { CVPreview } from "./CVPreview";
import { supabase } from "@/integrations/supabase/client";
import type { CVData, SkillItem, ExperienceItem, EducationItem } from "@/types/cv";
import type { CVStyle } from "@/types";
import { toast } from "@/hooks/use-toast";

type SectionId = "summary" | "skills" | "experience" | "education" | "additional";

interface SectionMeta {
  id: SectionId;
  title: string;
  icon: React.ElementType;
  placeholder: string;
}

const SECTIONS: SectionMeta[] = [
  { id: "summary", title: "Professional Summary", icon: FileText, placeholder: "Write or add AI suggestions for your professional summary..." },
  { id: "skills", title: "Key Skills", icon: Star, placeholder: "Add your key skills, one per line..." },
  { id: "experience", title: "Work Experience", icon: Briefcase, placeholder: "Describe your work experience achievements..." },
  { id: "education", title: "Education", icon: GraduationCap, placeholder: "Add your education details..." },
  { id: "additional", title: "Additional Sections", icon: Award, placeholder: "Certifications, languages, volunteer work..." },
];

interface GuidedCVBuilderProps {
  userName: string;
  userEmail: string;
  userPhone: string;
  jobTitle: string;
  jobDescription: string;
  onUsageLimit?: () => void;
}

export const GuidedCVBuilder = ({
  userName,
  userEmail,
  userPhone,
  jobTitle,
  jobDescription,
  onUsageLimit,
}: GuidedCVBuilderProps) => {
  const [openSection, setOpenSection] = useState<SectionId>("summary");
  const [sectionContent, setSectionContent] = useState<Record<SectionId, string>>({
    summary: "",
    skills: "",
    experience: "",
    education: "",
    additional: "",
  });
  const [suggestions, setSuggestions] = useState<Record<SectionId, string[]>>({
    summary: [],
    skills: [],
    experience: [],
    education: [],
    additional: [],
  });
  const [addedSuggestions, setAddedSuggestions] = useState<Record<SectionId, Set<string>>>({
    summary: new Set(),
    skills: new Set(),
    experience: new Set(),
    education: new Set(),
    additional: new Set(),
  });
  const [loadingSection, setLoadingSection] = useState<SectionId | null>(null);
  const [cvStyle, setCvStyle] = useState<CVStyle>("standard");

  const generateSuggestions = useCallback(
    async (section: SectionId) => {
      setLoadingSection(section);
      try {
        const response = await supabase.functions.invoke("generate-suggestions", {
          body: {
            section,
            jobTitle,
            jobDescription,
            existingContent: sectionContent[section] || "",
            userName,
            userEmail,
          },
        });

        if (response.error) {
          if (response.error.message?.toLowerCase().includes("usage limit")) {
            toast({ title: "Usage limit reached", description: "Please upgrade your plan for more AI suggestions.", variant: "destructive" });
            onUsageLimit?.();
            return;
          }
          throw new Error(response.error.message);
        }

        if (response.data?.error) {
          if (response.data.error.includes("Rate limit")) {
            toast({ title: "Rate limited", description: "Please wait a moment and try again.", variant: "destructive" });
            return;
          }
          if (response.data.error.includes("Usage limit") || response.data.error.includes("upgrade")) {
            toast({ title: "Usage limit reached", description: "Please upgrade your plan for more AI suggestions.", variant: "destructive" });
            onUsageLimit?.();
            return;
          }
          throw new Error(response.data.error);
        }

        const newSuggestions = response.data?.suggestions || [];
        setSuggestions((prev) => ({ ...prev, [section]: newSuggestions }));
        // Clear added state for this section since new suggestions
        setAddedSuggestions((prev) => ({ ...prev, [section]: new Set() }));
      } catch (err: any) {
        console.error("Error generating suggestions:", err);
        if (String(err?.message || "").toLowerCase().includes("usage limit")) {
          onUsageLimit?.();
        }
        toast({
          title: "Error",
          description: err.message || "Failed to generate suggestions",
          variant: "destructive",
        });
      } finally {
        setLoadingSection(null);
      }
    },
    [jobTitle, jobDescription, sectionContent, userName, userEmail]
  );

  const handleOpenSection = (sectionId: SectionId) => {
    setOpenSection(sectionId);
    // Auto-generate suggestions if none exist for this section
    if (suggestions[sectionId].length === 0 && !loadingSection) {
      generateSuggestions(sectionId);
    }
  };

  const handleAddSuggestion = (section: SectionId, suggestion: string) => {
    if (addedSuggestions[section].has(suggestion)) return;

    setSectionContent((prev) => {
      const existing = prev[section].trim();
      const separator = existing ? "\n" : "";
      return { ...prev, [section]: existing + separator + suggestion };
    });
    setAddedSuggestions((prev) => {
      const newSet = new Set(prev[section]);
      newSet.add(suggestion);
      return { ...prev, [section]: newSet };
    });
  };

  const handleContentChange = (section: SectionId, value: string) => {
    setSectionContent((prev) => ({ ...prev, [section]: value }));
  };

  // Build CVData from section content for preview
  const buildCVData = (): CVData => {
    const [firstName = "", lastName = ""] = userName.split(" ");
    const skillLines = sectionContent.skills
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const skills: SkillItem[] = skillLines.length > 0 ? skillLines.map((name) => ({ name })) : [{ name: "Add your skills" }];

    const experience: ExperienceItem[] = sectionContent.experience.trim()
      ? [
          {
            company: "Your Company",
            role: jobTitle || "Your Role",
            startDate: "Start",
            endDate: "Present",
            bullets: sectionContent.experience
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        ]
      : [];

    const education: EducationItem[] = sectionContent.education.trim()
      ? [
          {
            institution: "Your Institution",
            qualification: "Your Qualification",
            startDate: "Start",
            endDate: "End",
            details: sectionContent.education
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        ]
      : [];

    return {
      personal: {
        firstName: firstName || "Your",
        lastName: lastName || "Name",
        title: jobTitle || "Target Role",
        location: "",
        phone: userPhone || "",
        email: userEmail || "",
        summary: sectionContent.summary || "Your professional summary will appear here.",
      },
      skills,
      experience,
      education,
    };
  };

  const cvData = buildCVData();

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: Section Editor */}
      <div className="space-y-4">
        <div className="text-center lg:text-left mb-2">
          <h2 className="text-xl font-bold text-foreground">Build Your CV</h2>
          <p className="text-sm text-muted-foreground">
            Open each section to get AI suggestions. Click + to add them to your CV.
          </p>
        </div>

        {SECTIONS.map((section) => {
          const isOpen = openSection === section.id;
          const isLoading = loadingSection === section.id;
          const sectionSuggestions = suggestions[section.id];
          const sectionAdded = addedSuggestions[section.id];
          const Icon = section.icon;

          return (
            <motion.div
              key={section.id}
              layout
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* Section header */}
              <button
                onClick={() => handleOpenSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{section.title}</span>
                    {sectionContent[section.id].trim() && (
                      <span className="ml-2 text-xs text-primary">✓ has content</span>
                    )}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Section body */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {/* Editable text area */}
                      <Textarea
                        value={sectionContent[section.id]}
                        onChange={(e) => handleContentChange(section.id, e.target.value)}
                        placeholder={section.placeholder}
                        className="min-h-[100px] resize-y"
                      />

                      {/* Suggestions header */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          AI Suggestions
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateSuggestions(section.id)}
                          disabled={isLoading}
                          className="gap-1 text-xs"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          {sectionSuggestions.length > 0 ? "Refresh suggestions" : "Generate"}
                        </Button>
                      </div>

                      {/* Suggestions list */}
                      {isLoading && sectionSuggestions.length === 0 ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Generating suggestions...
                        </div>
                      ) : sectionSuggestions.length > 0 ? (
                        <div className="space-y-2">
                          {sectionSuggestions.map((suggestion, idx) => (
                            <SuggestionBlock
                              key={`${section.id}-${idx}-${suggestion.slice(0, 20)}`}
                              text={suggestion}
                              isAdded={sectionAdded.has(suggestion)}
                              onAdd={() => handleAddSuggestion(section.id, suggestion)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          Click "Generate" to get AI suggestions for this section.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Right: Live CV Preview */}
      <div className="space-y-4">
        <div className="text-center lg:text-left mb-2">
          <h2 className="text-xl font-bold text-foreground">Live Preview</h2>
          <p className="text-sm text-muted-foreground">
            Your CV updates in real time. Download when ready.
          </p>
        </div>

        <CVPreview
          data={cvData}
          selectedTemplate={cvStyle}
          onTemplateChange={setCvStyle}
        />
      </div>
    </div>
  );
};
