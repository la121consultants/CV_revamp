import { motion } from "framer-motion";
import { FileSearch, Brain, FileCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingStatusProps {
  progress: number;
}

const stages = [
  { min: 0, max: 10, icon: FileSearch, label: "Initialising document generation..." },
  { min: 10, max: 40, icon: Brain, label: "Analysing CV content and role requirements..." },
  { min: 40, max: 70, icon: FileCheck, label: "Writing and structuring the document..." },
  { min: 70, max: 90, icon: Sparkles, label: "Formatting to professional A4 layout..." },
  { min: 90, max: 100, icon: CheckCircle2, label: "Final checks and preparing downloads..." },
];

const getCurrentStage = (progress: number) => {
  for (let i = stages.length - 1; i >= 0; i--) {
    if (progress >= stages[i].min) return stages[i];
  }
  return stages[0];
};

export const ProcessingStatus = ({ progress }: ProcessingStatusProps) => {
  const current = getCurrentStage(progress);
  const Icon = current.icon;
  const isComplete = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-2xl bg-card border border-border shadow-lg text-center max-w-lg mx-auto"
    >
      <motion.div
        animate={isComplete ? {} : { rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-primary"
      >
        <Icon className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {isComplete ? "Document Ready!" : "Generating Your Documents"}
      </h3>

      <p className="text-muted-foreground mb-6 min-h-[1.5rem]">
        {isComplete
          ? "Your document is ready. Please review or download."
          : current.label}
      </p>

      {/* Progress bar */}
      <div className="space-y-2 mb-6">
        <Progress value={progress} className="h-3 transition-all duration-500" />
        <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
      </div>

      {/* Stage dots */}
      <div className="flex justify-center gap-3">
        {stages.map((stage, i) => {
          const done = progress >= stage.max;
          const active = progress >= stage.min && progress < stage.max;
          return (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                done
                  ? "bg-primary"
                  : active
                  ? "bg-primary/60"
                  : "bg-muted"
              }`}
              animate={active ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          );
        })}
      </div>
    </motion.div>
  );
};
