import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted: () => void;
}

const companyLogos = [
  { name: "KPMG", style: "font-bold text-white/60 text-lg tracking-tight" },
  { name: "NHS", style: "font-bold text-white/60 text-lg tracking-wide" },
  { name: "Capgemini", style: "font-semibold text-white/60 text-lg" },
  { name: "Unilabs", style: "font-semibold text-white/60 text-lg" },
  { name: "Deloitte", style: "font-bold text-white/60 text-lg tracking-tight" },
];

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative w-full py-24 md:py-36 overflow-hidden gradient-hero">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Orange glow accent */}
      <div className="absolute top-1/3 right-0 w-[600px] h-[400px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(ellipse, hsl(30, 92%, 50%), transparent 70%)' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="premium-badge bg-secondary/15 text-secondary border border-secondary/25 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Career Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white mb-6 text-balance leading-tight"
          >
            Get Interview-Ready.{" "}
            <span className="text-gradient">Get Hired Faster.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto text-balance leading-relaxed"
          >
            Whether you're a graduate, career changer, returning parent, or senior leader — 
            LA121 CV Revamp Tool builds ATS-optimised, recruiter-ready CVs tailored to your target role in minutes.
          </motion.p>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-10"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              <span className="font-semibold text-white">100s</span>
              <span className="text-white/50 text-sm">job seekers served</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
              ))}
              <span className="ml-1 text-sm font-medium text-white/80">4.9/5</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/50" />
              <span className="text-white/50 text-sm">GDPR Compliant</span>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="gradient-secondary shadow-secondary hover:opacity-90 transition-all text-lg px-8 h-14 font-semibold"
            >
              Build a UK-Ready CV
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white border-white/20 hover:bg-white/10 hover:text-white text-lg px-8 h-14"
            >
              <Zap className="w-5 h-5 mr-2" />
              Preview Tools
            </Button>
          </motion.div>

          {/* Company logos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-4 font-medium">
              Trusted by applicants targeting
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {companyLogos.map((c) => (
                <span key={c.name} className={`${c.style} hover:text-white/90 transition-colors select-none`}>
                  {c.name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
