import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FileText, Mail, Brain, Target, BarChart3, FileCheck, 
  GraduationCap, Briefcase, Baby, Rocket, Plane, Users2, ArrowUpRight, 
  ArrowRight, Check, Sparkles, ChevronDown, ChevronUp, Shield, Zap, Star
} from "lucide-react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Footer } from "@/components/Footer";
import { MainAppView } from "@/components/MainAppView";
import { Button } from "@/components/ui/button";

const audienceTiles = [
  { icon: GraduationCap, title: "Students & Graduates", desc: "Stand out from day one with a polished, role-targeted CV." },
  { icon: Rocket, title: "Apprenticeships", desc: "Showcase transferable skills and ambition — even without years of experience." },
  { icon: Briefcase, title: "Internships", desc: "Make your application memorable and land competitive placements." },
  { icon: ArrowUpRight, title: "Career Changers", desc: "Reframe your experience for a new direction with confidence." },
  { icon: Baby, title: "Maternity & Parental Returners", desc: "Re-enter the workforce with a CV that reflects your strengths, not the gap." },
  { icon: Users2, title: "Leaders & Managers", desc: "Present executive-level impact with a CV that commands attention." },
  { icon: Plane, title: "Specialist Careers", desc: "Aviation, healthcare, legal — tailored formatting for niche industries." },
  { icon: Target, title: "Entry to Senior", desc: "From first job to board-level — we adapt to your career stage." },
];

const features = [
  { icon: FileText, title: "CV Builder & Revamp", desc: "AI rewrites your CV to match ATS requirements and recruiter expectations." },
  { icon: Mail, title: "Cover Letter Generator", desc: "Compelling, role-specific cover letters crafted in seconds." },
  { icon: Brain, title: "AI Refinement Chat", desc: "Fine-tune your documents with natural-language commands." },
  { icon: Target, title: "Job Description Matching", desc: "Paste a job URL or description — we extract and align requirements." },
  { icon: BarChart3, title: "Progress Tracking", desc: "Real-time generation progress with quality checkpoints." },
  { icon: FileCheck, title: "Recruiter-Ready Formatting", desc: "A4-perfect Word and PDF exports that pass formatting checks." },
];

const pricingPlans = [
  {
    name: "Free",
    price: "£0",
    period: "per day",
    desc: "Try before you commit",
    features: ["1 CV revamp per day", "AI-powered tailoring", "ATS keyword optimisation", "Preview output"],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pay Per CV",
    price: "£1",
    period: "one-off",
    desc: "Download when you need it",
    features: ["Everything in Free", "Word & PDF downloads", "Cover letter included", "A4 preview & formatting"],
    cta: "Buy Now",
    popular: false,
  },
  {
    name: "Unlimited",
    price: "£9.99",
    period: "/month",
    desc: "Best value for active job seekers",
    features: ["Unlimited CV revamps", "Unlimited downloads", "Priority AI processing", "All templates & styles", "Cover letter generator", "Cancel anytime"],
    cta: "Start Unlimited",
    popular: true,
  },
];

const faqs = [
  { q: "How does the AI CV builder work?", a: "Upload your existing CV and paste a job description. Our AI analyses the role requirements and rewrites your CV to highlight relevant experience, skills, and ATS-friendly keywords — all in professional UK English." },
  { q: "Is the CV review free?", a: "Yes — every user gets one free CV revamp per day. For unlimited access, upgrade to our monthly plan at £9.99/month or pay £1 per document download." },
  { q: "Does it work for UK jobs?", a: "Absolutely. LA121 CV Revamp Tool is built specifically for the UK job market, using British English and formatting conventions trusted by graduates, career changers, and senior leaders." },
  { q: "What is ATS optimisation?", a: "ATS (Applicant Tracking System) optimisation ensures your CV contains the right keywords and formatting to pass automated screening software used by most UK employers." },
  { q: "Can I use this returning from maternity leave?", a: "Yes. LA121 CV Revamp Tool is designed for career returners, including parents returning after maternity or paternity leave. Our AI helps present your experience confidently and address gaps professionally." },
  { q: "Is it suitable for apprenticeship applications?", a: "Absolutely. Whether you're applying for your first apprenticeship or a competitive internship, LA121 CV Revamp Tool tailors your CV to highlight transferable skills, education, and potential." },
];

const Index = () => {
  const [view, setView] = useState<'home' | 'app'>('home');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero onGetStarted={() => setView('app')} />

              {/* Who It's For */}
              <section id="who-its-for" className="py-20 bg-card">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                  >
                    <span className="premium-badge bg-primary/10 text-primary border border-primary/20 mb-4">
                      <Users2 className="w-3.5 h-3.5" />
                      Built For Everyone
                    </span>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                      Who Is It For?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      From your first application to your next promotion — we've got you covered.
                    </p>
                  </motion.div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {audienceTiles.map((tile, i) => (
                      <motion.div
                        key={tile.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="premium-card p-5 group cursor-default"
                      >
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                          <tile.icon className="w-5 h-5 text-secondary" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm mb-1">{tile.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tile.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
              
              {/* Features */}
              <section id="features" className="py-20 bg-background">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                  >
                    <span className="premium-badge bg-secondary/10 text-secondary border border-secondary/20 mb-4">
                      <Zap className="w-3.5 h-3.5" />
                      Platform Features
                    </span>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                      Everything You Need to Get Hired
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Professional tools powered by AI, designed for the UK job market.
                    </p>
                  </motion.div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 }}
                        className="premium-card p-6 group"
                      >
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-primary group-hover:scale-105 transition-transform">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* How it Works */}
              <section id="how-it-works" className="py-20 bg-card">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                  >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                      Three Steps to Your Perfect CV
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Simple, fast, and effective.
                    </p>
                  </motion.div>

                  <div className="max-w-3xl mx-auto">
                    {[
                      { step: "01", title: "Upload Your CV", desc: "PDF, Word, or plain text — our parser extracts your experience instantly." },
                      { step: "02", title: "Add Job Details", desc: "Paste a job description or URL. The AI identifies key requirements automatically." },
                      { step: "03", title: "Download & Apply", desc: "Get your ATS-optimised CV and cover letter. Preview, download, and apply with confidence." },
                    ].map((item, index) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.15 }}
                        className="flex gap-6 mb-10 last:mb-0"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-xl gradient-secondary flex items-center justify-center shadow-secondary">
                            <span className="text-xl font-display font-bold text-white">{item.step}</span>
                          </div>
                        </div>
                        <div className="pt-1">
                          <h3 className="text-xl font-display font-semibold text-foreground mb-1">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Reviews */}
              <ReviewsSection />

              {/* Pricing */}
              <section id="pricing" className="py-20 gradient-hero">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                  >
                    <span className="premium-badge bg-secondary/15 text-secondary border border-secondary/25 mb-4">
                      <Sparkles className="w-3.5 h-3.5" />
                      Pricing
                    </span>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                      Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                      Start free. Upgrade when you're ready.
                    </p>
                  </motion.div>

                  <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {pricingPlans.map((plan, index) => (
                      <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative rounded-2xl p-6 ${
                          plan.popular
                            ? "bg-white border-2 border-secondary shadow-xl scale-105"
                            : "bg-white/5 border border-white/10 backdrop-blur-sm"
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="premium-badge gradient-secondary text-white shadow-secondary">
                              <Star className="w-3 h-3 fill-white" />
                              Best Value
                            </span>
                          </div>
                        )}
                        <div className="mb-5">
                          <h3 className={`font-display font-bold text-lg mb-1 ${plan.popular ? "text-foreground" : "text-white"}`}>
                            {plan.name}
                          </h3>
                          <p className={`text-xs mb-4 ${plan.popular ? "text-muted-foreground" : "text-white/50"}`}>
                            {plan.desc}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-display font-extrabold ${plan.popular ? "text-foreground" : "text-white"}`}>
                              {plan.price}
                            </span>
                            <span className={`text-sm ${plan.popular ? "text-muted-foreground" : "text-white/50"}`}>
                              {plan.period}
                            </span>
                          </div>
                        </div>
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((f) => (
                            <li key={f} className={`flex items-start gap-2 text-sm ${plan.popular ? "text-foreground" : "text-white/70"}`}>
                              <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-secondary" : "text-secondary/70"}`} />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => setView('app')}
                          className={`w-full h-11 font-semibold ${
                            plan.popular
                              ? "gradient-secondary shadow-secondary hover:opacity-90 text-white"
                              : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                          }`}
                        >
                          {plan.cta}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* FAQ */}
              <section id="faq" className="py-20 bg-background">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                  >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                      Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Got questions? We've got answers.
                    </p>
                  </motion.div>

                  <div className="max-w-3xl mx-auto space-y-3">
                    {faqs.map((faq, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="premium-card overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full flex items-center justify-between p-5 text-left"
                        >
                          <span className="font-semibold text-foreground text-sm pr-4">{faq.q}</span>
                          {openFaq === i ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>
                        <AnimatePresence>
                          {openFaq === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Final CTA */}
              <section className="py-20 gradient-hero">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                  >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                      Ready to Get Hired?
                    </h2>
                    <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
                      Join hundreds of UK job seekers who've transformed their applications with LA121 CV Revamp Tool.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setView('app')}
                      className="gradient-secondary shadow-secondary hover:opacity-90 transition-all text-lg px-10 h-14 font-semibold"
                    >
                      Build a UK-Ready CV
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MainAppView onBack={() => setView('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
