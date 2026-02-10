import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionSuggestion } from "@/types";

interface MissingSectionSuggestionsProps {
  suggestions: SectionSuggestion[];
  onAddSection: (section: SectionSuggestion) => void;
}

export const MissingSectionSuggestions = ({
  suggestions,
  onAddSection,
}: MissingSectionSuggestionsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [addedSections, setAddedSections] = useState<Set<string>>(new Set());

  if (!suggestions || suggestions.length === 0) return null;

  const handleAdd = (suggestion: SectionSuggestion) => {
    setAddedSections((prev) => new Set(prev).add(suggestion.section));
    onAddSection(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-foreground text-sm">
            {suggestions.length} suggested section{suggestions.length > 1 ? "s" : ""} to strengthen your CV
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground mt-2 mb-3">
              These sections were not found in your uploaded CV but may help for this role. Click + to add.
            </p>
            <div className="space-y-3">
              {suggestions.map((s) => {
                const isAdded = addedSections.has(s.section);
                return (
                  <div
                    key={s.section}
                    className={`rounded-lg border p-3 transition-colors ${
                      isAdded
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{s.section}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                        <div className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">
                          {s.suggestedContent}
                        </div>
                      </div>
                      <Button
                        variant={isAdded ? "ghost" : "outline"}
                        size="icon"
                        onClick={() => handleAdd(s)}
                        disabled={isAdded}
                        className="flex-shrink-0 h-8 w-8"
                        aria-label={isAdded ? "Added" : `Add ${s.section}`}
                      >
                        {isAdded ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
