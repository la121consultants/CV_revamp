import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Amina K.",
    role: "Graduate, London",
    text: "I used the free revamp and got an interview at KPMG the same week. The ATS optimisation made all the difference — highly recommend!",
    rating: 5,
  },
  {
    name: "James O.",
    role: "Senior Nurse, Manchester",
    text: "Applying to NHS Band 7 roles was so stressful. TVV tailored my CV perfectly to the person specification. I secured the role within a month.",
    rating: 5,
  },
  {
    name: "Priya S.",
    role: "IT Consultant, Birmingham",
    text: "The cover letter generator alone is worth it. I landed a contract at Capgemini after using TVV to revamp my entire application.",
    rating: 5,
  },
  {
    name: "Daniel M.",
    role: "Lab Technician, Leeds",
    text: "Brilliant tool — simple to use and the results are professional. My CV went from generic to role-specific in minutes.",
    rating: 5,
  },
  {
    name: "Sophie R.",
    role: "Marketing Manager, Bristol",
    text: "I was sceptical about AI CV tools, but this one genuinely understands UK job market language. Five stars from me.",
    rating: 5,
  },
];

export const ReviewsSection = () => {
  return (
    <section id="reviews" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="premium-badge bg-secondary/10 text-secondary border border-secondary/20 mb-4">
            <Star className="w-3.5 h-3.5 fill-secondary" />
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Trusted by Job Seekers Across the UK
          </h2>
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-secondary text-secondary" />
            ))}
          </div>
          <p className="text-lg text-muted-foreground">
            Rated 4.9/5 — see what our users say
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="premium-card p-6 relative group"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-secondary/10 group-hover:text-secondary/20 transition-colors" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                ))}
              </div>
              <p className="text-foreground mb-5 leading-relaxed text-sm">"{review.text}"</p>
              <div className="border-t border-border pt-4">
                <p className="font-semibold text-foreground text-sm">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
