import { Shield, Lock, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="w-full py-12 px-6 bg-primary text-white/80">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="LA121 CV Revamp Tool" className="h-10 w-auto brightness-0 invert" />
              <div>
                <p className="font-display font-bold text-white text-lg">LA121 CV Revamp</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">By LA121 Consultants</p>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-3">
              AI-powered CV builder for UK job seekers. From graduates to senior leaders, we help you get hired faster.
            </p>
            <a
              href="https://la121consultants.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-secondary/80 transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Visit la121consultants.co.uk
            </a>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Tools</h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#features" className="hover:text-white transition-colors">CV Builder UK</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Cover Letter Generator</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">ATS Optimisation</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Interview Preparation</a></li>
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Who It's For</h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#who-its-for" className="hover:text-white transition-colors">Students & Graduates</a></li>
              <li><a href="#who-its-for" className="hover:text-white transition-colors">Career Changers</a></li>
              <li><a href="#who-its-for" className="hover:text-white transition-colors">Maternity Returners</a></li>
              <li><a href="#who-its-for" className="hover:text-white transition-colors">Leaders & Managers</a></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              </li>
              <li>
                <a
                  href="mailto:admin@la121consultants.co.uk"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Admin & Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} LA121 Consultants. All rights reserved.
            </p>
            <span className="text-xs text-white/30">
              Powered by LA121 Consultants
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30">
              For support: admin@la121consultants.co.uk
            </span>
            <span className="text-xs text-white/30 flex items-center gap-1">
              <Shield className="w-3 h-3" /> GDPR Compliant
            </span>
            <Link 
              to="/admin/login" 
              className="text-xs text-white/20 hover:text-white/40 transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3" /> Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
