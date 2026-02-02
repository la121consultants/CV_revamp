import { FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-4 px-6 glass sticky top-0 z-50 border-b border-border"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <Sparkles className="w-4 h-4 text-secondary absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">LA121</h1>
            <p className="text-xs text-muted-foreground">AI CV Review</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
        </nav>
      </div>
    </motion.header>
  );
};
