import { motion } from "framer-motion";
import { FileText, Mail, Files } from "lucide-react";
import type { OutputType } from "@/types";

interface OutputTypeSelectorProps {
  selected: OutputType;
  onChange: (type: OutputType) => void;
}

const options: { type: OutputType; label: string; icon: typeof FileText; description: string }[] = [
  {
    type: 'cv',
    label: 'Tailored CV',
    icon: FileText,
    description: 'Just the CV',
  },
  {
    type: 'coverLetter',
    label: 'Cover Letter',
    icon: Mail,
    description: 'Just the letter',
  },
  {
    type: 'both',
    label: 'Both',
    icon: Files,
    description: 'CV + Cover Letter',
  },
];

export const OutputTypeSelector = ({ selected, onChange }: OutputTypeSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <p className="text-sm font-medium text-foreground">What would you like to generate?</p>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.type}
            onClick={() => onChange(option.type)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${selected === option.type 
                ? 'border-primary bg-primary-light' 
                : 'border-border bg-card hover:border-primary/50'
              }
            `}
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center mb-3
              ${selected === option.type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
            `}>
              <option.icon className="w-5 h-5" />
            </div>
            <p className="font-medium text-foreground text-sm">{option.label}</p>
            <p className="text-xs text-muted-foreground">{option.description}</p>
            
            {selected === option.type && (
              <motion.div
                layoutId="selected-indicator"
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};
