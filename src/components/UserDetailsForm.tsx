import { motion } from "framer-motion";
import { User, Mail, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { UserDetails } from "@/types";

interface UserDetailsFormProps {
  userDetails: UserDetails;
  onChange: (details: UserDetails) => void;
}

export const UserDetailsForm = ({ userDetails, onChange }: UserDetailsFormProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full-name" className="flex items-center gap-2 text-foreground">
            <User className="w-4 h-4 text-primary" />
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full-name"
            placeholder="John Smith"
            value={userDetails.fullName}
            onChange={(e) => onChange({ ...userDetails, fullName: e.target.value })}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
            <Mail className="w-4 h-4 text-primary" />
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={userDetails.email}
            onChange={(e) => onChange({ ...userDetails, email: e.target.value })}
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
          <Phone className="w-4 h-4 text-primary" />
          Phone Number
          <span className="text-xs text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+44 7123 456789"
          value={userDetails.phone}
          onChange={(e) => onChange({ ...userDetails, phone: e.target.value })}
          className="h-11"
        />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Your information is kept private and secure. See our privacy policy for details.
      </p>
    </motion.div>
  );
};
