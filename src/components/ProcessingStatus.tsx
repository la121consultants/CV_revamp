import { motion } from "framer-motion";
import { Loader2, FileSearch, Brain, FileCheck } from "lucide-react";

interface ProcessingStatusProps {
  stage: 'analyzing' | 'processing' | 'generating';
}

const stages = {
  analyzing: {
    icon: FileSearch,
    title: 'Analyzing Documents',
    description: 'Reading your CV and job description...',
  },
  processing: {
    icon: Brain,
    title: 'AI Processing',
    description: 'Identifying key skills and matching requirements...',
  },
  generating: {
    icon: FileCheck,
    title: 'Generating Output',
    description: 'Creating your tailored documents...',
  },
};

export const ProcessingStatus = ({ stage }: ProcessingStatusProps) => {
  const currentStage = stages[stage];
  const Icon = currentStage.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-2xl bg-card border border-border shadow-lg text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-primary"
      >
        <Icon className="w-10 h-10 text-primary-foreground" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">{currentStage.title}</h3>
      <p className="text-muted-foreground mb-6">{currentStage.description}</p>
      
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">This may take a moment...</span>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {Object.keys(stages).map((s, i) => (
          <motion.div
            key={s}
            className={`w-3 h-3 rounded-full ${
              s === stage 
                ? 'bg-primary' 
                : Object.keys(stages).indexOf(stage) > i 
                  ? 'bg-success' 
                  : 'bg-muted'
            }`}
            animate={s === stage ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
};
