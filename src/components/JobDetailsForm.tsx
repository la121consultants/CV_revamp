import { motion } from "framer-motion";
import { Briefcase, Users, Link, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobDescription } from "@/types";

interface JobDetailsFormProps {
  jobDetails: JobDescription;
  onChange: (details: JobDescription) => void;
  inputMethod: "manual" | "linkedin";
  onInputMethodChange: (method: "manual" | "linkedin") => void;
}

export const JobDetailsForm = ({ jobDetails, onChange, inputMethod, onInputMethodChange }: JobDetailsFormProps) => {

  const handleLinkedInUrl = (url: string) => {
    onChange({ ...jobDetails, linkedinUrl: url });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      <Tabs value={inputMethod} onValueChange={(v) => onInputMethodChange(v as "manual" | "linkedin")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="manual" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Enter Manually
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-2">
            <Link className="w-4 h-4" />
            Paste LinkedIn URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="linkedin" className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="linkedin-url" className="flex items-center gap-2 text-foreground">
              <ExternalLink className="w-4 h-4 text-primary" />
              LinkedIn Job URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder="https://www.linkedin.com/jobs/view/..."
              value={jobDetails.linkedinUrl || ''}
              onChange={(e) => handleLinkedInUrl(e.target.value)}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Paste the full LinkedIn job posting URL. We'll extract the job details automatically.
            </p>
          </div>

          {/* Still need job title for LinkedIn method */}
          <div className="space-y-3">
            <Label htmlFor="job-title-linkedin" className="flex items-center gap-2 text-foreground">
              <Briefcase className="w-4 h-4 text-primary" />
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="job-title-linkedin"
              placeholder="e.g. Senior Software Engineer"
              value={jobDetails.title}
              onChange={(e) => onChange({ ...jobDetails, title: e.target.value })}
              className="h-12"
            />
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="job-title" className="flex items-center gap-2 text-foreground">
              <Briefcase className="w-4 h-4 text-primary" />
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="job-title"
              placeholder="e.g. Senior Software Engineer"
              value={jobDetails.title}
              onChange={(e) => onChange({ ...jobDetails, title: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="job-description" className="flex items-center gap-2 text-foreground">
              <Briefcase className="w-4 h-4 text-primary" />
              Job Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here..."
              value={jobDetails.description}
              onChange={(e) => onChange({ ...jobDetails, description: e.target.value })}
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="person-spec" className="flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-primary" />
              Person Specification
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="person-spec"
              placeholder="Paste the person specification or key requirements here..."
              value={jobDetails.personSpec || ''}
              onChange={(e) => onChange({ ...jobDetails, personSpec: e.target.value })}
              className="min-h-[120px] resize-none"
            />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
