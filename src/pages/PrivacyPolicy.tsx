import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full py-4 px-6 glass sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LA121 Consultants" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-foreground">LA121</h1>
              <p className="text-xs text-muted-foreground">AI CV Review</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                LA121 Consultants ("we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our AI CV Review service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Personal details: name, email address, and phone number</li>
                <li>CV/Resume content that you upload</li>
                <li>Job descriptions and person specifications you provide</li>
                <li>LinkedIn job URLs you submit</li>
                <li>Communications you have with our AI assistant</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide and improve our CV tailoring services</li>
                <li>Generate personalised CVs and cover letters</li>
                <li>Communicate with you about our services</li>
                <li>Respond to your enquiries and support requests</li>
                <li>Analyse usage patterns to improve our service</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organisational measures to protect your 
                personal information against unauthorised access, alteration, disclosure, or 
                destruction. Your data is stored securely and access is restricted to authorised 
                personnel only.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to provide our 
                services and fulfil the purposes outlined in this policy. You may request 
                deletion of your data at any time by contacting us.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">6. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use AI technology to process and tailor your CV. Your data may be processed 
                by our AI service providers in accordance with their privacy policies and our 
                data processing agreements. We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Under applicable data protection laws, you have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us at:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mt-2">
                <p className="text-foreground font-medium">LA121 Consultants</p>
                <p className="text-muted-foreground">Email: admin@la121consultants.co.uk</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of 
                any changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
