import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { MainAppView } from "@/components/MainAppView";

const Index = () => {
  const [view, setView] = useState<'home' | 'app'>('home');

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
              
              {/* Features Section */}
              <section id="features" className="py-20 bg-card">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      Why Choose LA121 AI CV Review?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Our AI-powered platform gives you the edge you need in today's competitive job market.
                    </p>
                  </motion.div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      {
                        title: "Smart Matching",
                        description: "Our AI analyzes job descriptions and identifies the key requirements to highlight your most relevant experience.",
                        color: "primary",
                      },
                      {
                        title: "Professional Formatting",
                        description: "Get a beautifully formatted CV that's ATS-friendly and catches the recruiter's eye.",
                        color: "secondary",
                      },
                      {
                        title: "Cover Letter Generator",
                        description: "Automatically generate compelling cover letters that complement your tailored CV.",
                        color: "primary",
                      },
                      {
                        title: "AI Refinement",
                        description: "Use our AI chat to further refine and perfect your documents with simple commands.",
                        color: "secondary",
                      },
                      {
                        title: "Multiple Formats",
                        description: "Download your documents in PDF, Word, or plain text formats.",
                        color: "primary",
                      },
                      {
                        title: "Privacy First",
                        description: "Your documents are processed securely and never stored permanently.",
                        color: "secondary",
                      },
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-lg transition-shadow"
                      >
                        <div className={`w-3 h-3 rounded-full mb-4 ${
                          feature.color === 'primary' ? 'bg-primary' : 'bg-secondary'
                        }`} />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* How it Works Section */}
              <section id="how-it-works" className="py-20 bg-background">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      How It Works
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Three simple steps to your perfect application
                    </p>
                  </motion.div>

                  <div className="max-w-4xl mx-auto">
                    {[
                      {
                        step: "01",
                        title: "Upload Your CV",
                        description: "Upload your existing CV in PDF, Word, or text format. Our system will parse and understand your experience.",
                      },
                      {
                        step: "02",
                        title: "Add Job Details",
                        description: "Paste the job description and person specification. The more details you provide, the better the results.",
                      },
                      {
                        step: "03",
                        title: "Get Tailored Results",
                        description: "Receive your AI-tailored CV and cover letter. Use the AI chat to make further refinements.",
                      },
                    ].map((item, index) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        className="flex gap-6 mb-12 last:mb-0"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-primary">
                            <span className="text-2xl font-bold text-primary-foreground">{item.step}</span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="py-20 gradient-hero">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      Ready to Land Your Dream Job?
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      Start tailoring your CV today and increase your chances of getting noticed.
                    </p>
                    <button
                      onClick={() => setView('app')}
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl gradient-primary text-primary-foreground shadow-primary hover:opacity-90 transition-opacity"
                    >
                      Get Started Free
                    </button>
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
