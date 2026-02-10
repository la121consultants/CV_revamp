import { motion } from "framer-motion";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-4 px-6 glass sticky top-0 z-50 border-b border-border"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="LA121 Consultants" className="h-12 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-foreground">LA121</h1>
            <p className="text-xs text-muted-foreground">AI CV Review</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4">
          <a href="#features" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
          <button onClick={() => navigate("/subscription")} className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Subscription
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[150px]">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { await signOut(); navigate("/"); }}
                className="gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="gap-1"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </motion.header>
  );
};
