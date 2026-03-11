import { motion } from "framer-motion";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "@/assets/logo.png";

const navLinkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors font-medium";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-3 px-6 glass sticky top-0 z-50 border-b border-border/50"
    >
      <div className="container mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src={logo} alt="LA121 CV Revamp Tool" className="h-10 w-auto" />
          <div>
            <h1 className="text-base font-display font-bold text-foreground tracking-tight leading-tight">LA121 CV Revamp</h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">By LA121 Consultants</p>
          </div>
        </a>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="/#features" className={navLinkClass}>Features</a>
          <a href="/#who-its-for" className={navLinkClass}>Who It's For</a>
          <a href="/#how-it-works" className={navLinkClass}>How It Works</a>
          {user ? (
            <button onClick={() => navigate("/subscription")} className={navLinkClass}>
              My Plan
            </button>
          ) : (
            <a href="/#pricing" className={navLinkClass}>Pricing</a>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { await signOut(); navigate("/"); }}
                className="gap-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="gap-1 border-border/60"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-border/50 mt-3 pt-4 pb-2 space-y-3"
        >
          <a href="/#features" className="block text-sm text-muted-foreground px-2 py-1" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="/#who-its-for" className="block text-sm text-muted-foreground px-2 py-1" onClick={() => setMobileOpen(false)}>Who It's For</a>
          <a href="/#how-it-works" className="block text-sm text-muted-foreground px-2 py-1" onClick={() => setMobileOpen(false)}>How It Works</a>
          {user ? (
            <>
              <button className="block text-sm text-muted-foreground px-2 py-1" onClick={() => { navigate("/subscription"); setMobileOpen(false); }}>My Plan</button>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); setMobileOpen(false); }}>
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <a href="/#pricing" className="block text-sm text-muted-foreground px-2 py-1" onClick={() => setMobileOpen(false)}>Pricing</a>
              <Button variant="outline" size="sm" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
                <LogIn className="w-4 h-4 mr-1" /> Sign In
              </Button>
            </>
          )}
        </motion.div>
      )}
    </motion.header>
  );
};
