import { motion } from "framer-motion";
import { CalendarCheck, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CareerSupportCTAProps {
  /** Compact variant for inline use after CV output */
  compact?: boolean;
}

export const CareerSupportCTA = ({ compact = false }: CareerSupportCTAProps) => {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 premium-card p-6 text-center border-secondary/20"
      >
        <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center mx-auto mb-4 shadow-secondary">
          <Handshake className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-display font-bold text-foreground mb-2">
          Need Further Support to Get a Job?
        </h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-5 leading-relaxed">
          If you would like personalised guidance, strategy, or expert feedback, you can book a one-to-one session with one of our experienced career consultants. We support job seekers with CV strategy, interview preparation, job search planning, and confidence building.
        </p>
        <Button
          asChild
          className="gradient-secondary shadow-secondary hover:opacity-90 transition-all font-semibold px-8 h-11"
        >
          <a href="https://calendly.com/la121consultants" target="_blank" rel="noopener noreferrer">
            <CalendarCheck className="w-4 h-4 mr-2" />
            Book a Career Expert
          </a>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Delivered by LA121 Consultants – trusted career experts supporting job seekers across the UK.
        </p>
      </motion.div>
    );
  }

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center mx-auto mb-6 shadow-secondary">
            <Handshake className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Need Further Support to Get a Job?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            If you would like personalised guidance, strategy, or expert feedback, you can book a one-to-one session with one of our experienced career consultants. We support job seekers with CV strategy, interview preparation, job search planning, and confidence building.
          </p>
          <Button
            asChild
            size="lg"
            className="gradient-secondary shadow-secondary hover:opacity-90 transition-all text-lg px-10 h-14 font-semibold"
          >
            <a href="https://calendly.com/la121consultants" target="_blank" rel="noopener noreferrer">
              <CalendarCheck className="w-5 h-5 mr-2" />
              Book a Career Expert
            </a>
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            Delivered by LA121 Consultants – trusted career experts supporting job seekers across the UK.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
