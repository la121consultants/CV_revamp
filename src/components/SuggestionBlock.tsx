import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuggestionBlockProps {
  text: string;
  isAdded: boolean;
  onAdd: () => void;
}

export const SuggestionBlock = ({ text, isAdded, onAdd }: SuggestionBlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
        isAdded
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-muted/30 hover:border-primary/50"
      }`}
    >
      <p className="flex-1 text-sm text-foreground leading-relaxed">{text}</p>
      <Button
        variant={isAdded ? "ghost" : "outline"}
        size="icon"
        onClick={onAdd}
        disabled={isAdded}
        className={`flex-shrink-0 h-9 w-9 rounded-lg transition-colors ${
          isAdded
            ? "text-primary cursor-default"
            : "hover:bg-primary hover:text-primary-foreground"
        }`}
        aria-label={isAdded ? "Already added" : "Add to CV"}
        title={isAdded ? "Added" : "Add to CV"}
      >
        {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </Button>
    </motion.div>
  );
};
