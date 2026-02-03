import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-4 px-6 glass sticky top-0 z-50 border-b border-border"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="LA121 Consultants" className="h-12 w-auto" />
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
