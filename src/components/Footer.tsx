import { Heart, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="w-full py-8 px-6 border-t border-border bg-card">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LA121 Consultants" className="h-10 w-auto" />
            <span className="text-sm font-medium text-foreground">LA121 AI CV Review</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/privacy-policy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Shield className="w-4 h-4" />
              Privacy Policy
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-secondary fill-secondary" /> by LA121 Consultants
          </p>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LA121 Consultants. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
