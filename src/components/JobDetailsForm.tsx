import { motion } from "framer-motion";
import { Briefcase, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { JobDescription } from "@/types";

interface JobDetailsFormProps {
  jobDetails: JobDescription;
  onChange: (details: JobDescription) => void;
}

export const JobDetailsForm = ({ jobDetails, onChange }: JobDetailsFormProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <Label htmlFor="job-title" className="flex items-center gap-2 text-foreground">
          <Briefcase className="w-4 h-4 text-primary" />
          Job Title
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
          Job Description
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
    </motion.div>
  );
};
