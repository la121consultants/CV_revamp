import { FileText, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full py-6 px-6 border-t border-border bg-card">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">LA121 AI CV Review</span>
        </div>
        
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          Made with <Heart className="w-4 h-4 text-secondary fill-secondary" /> by LA121 Consultants
        </p>
        
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} All rights reserved
        </p>
      </div>
    </footer>
  );
};
