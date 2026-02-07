import { motion } from "framer-motion";
import { Sparkles, ListChecks } from "lucide-react";

export type CVBuildMode = "revamp" | "guided";

interface CVModeSelectorProps {
  onSelect: (mode: CVBuildMode) => void;
}

export const CVModeSelector = ({ onSelect }: CVModeSelectorProps) => {
  const modes = [
    {
      id: "revamp" as CVBuildMode,
      icon: Sparkles,
      title: "AI Full CV Revamp",
      description:
        "Upload your CV and job details. Our AI rewrites and tailors your entire CV in one go.",
      tag: "Existing",
    },
    {
      id: "guided" as CVBuildMode,
      icon: ListChecks,
      title: "Build CV with AI Suggestions",
      description:
        "Build your CV section by section. Get 3 AI-generated sentence suggestions per section and pick the ones you like.",
      tag: "New",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          How would you like to build your CV?
        </h2>
        <p className="text-muted-foreground">
          Choose the approach that works best for you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {modes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(mode.id)}
            className="group relative bg-card rounded-2xl border-2 border-border p-8 text-left shadow-sm hover:border-primary hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {mode.tag === "New" && (
              <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                NEW
              </span>
            )}
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-5 shadow-primary">
              <mode.icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {mode.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {mode.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
