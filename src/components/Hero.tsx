import { motion } from "framer-motion";
import { ArrowRight, FileCheck, Sparkles, Target, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

interface HeroProps {
  onGetStarted: () => void;
}

const companyLogos = [
  { name: "KPMG", style: "font-bold text-[#00338D] text-xl tracking-tight" },
  { name: "NHS", style: "font-bold text-[#005EB8] text-xl tracking-wide" },
  { name: "Capgemini", style: "font-semibold text-[#0070AD] text-lg" },
  { name: "Unilabs", style: "font-semibold text-[#E4002B] text-lg" },
];

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative w-full py-20 md:py-32 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              AI-Powered CV Revamp &amp; Review
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance"
          >
            Revamp Your CV &amp; Land Your{" "}
            <span className="text-primary">Dream Job</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance"
          >
            Upload your CV, paste a job description, and let our AI craft a tailored, 
            ATS-optimised CV and cover letter in minutes — all in perfect UK English.
          </motion.p>

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-8"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              <span className="font-semibold text-foreground">100s</span>
              <span className="text-muted-foreground text-sm">have used our tool</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
              ))}
              <span className="ml-1 text-sm font-medium text-foreground">4.9/5</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              "CV Revamp",
              "ATS Keyword Optimisation",
              "Cover Letter Generator",
              "Job URL Auto-Extraction",
            ].map((item) => (
              <span
                key={item}
                className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {item}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="gradient-primary shadow-primary hover:opacity-90 transition-opacity text-lg px-8"
            >
              Revamp My CV Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Trusted by companies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-14"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Popular in the UK for securing roles at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {companyLogos.map((c) => (
                <span key={c.name} className={`${c.style} opacity-70 hover:opacity-100 transition-opacity select-none`}>
                  {c.name}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            {[
              {
                icon: FileCheck,
                title: "Upload Your CV",
                description: "PDF or Word format supported",
              },
              {
                icon: Target,
                title: "Add Job Details",
                description: "Paste a job posting URL or description",
              },
              {
                icon: Sparkles,
                title: "Get Tailored Results",
                description: "AI creates your perfect CV & cover letter",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
