import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export const UpgradeModal = ({ open, onOpenChange, userEmail }: UpgradeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!userEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email before upgrading.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { planType: "monthly", userEmail },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error("Unable to start checkout session.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "Checkout failed",
        description: err.message || "Unable to start checkout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited CV revamps per day",
    "Unlimited AI suggestions",
    "All CV templates & colour palettes",
    "PDF & Word downloads",
    "AI cover letter generation",
    "Cancel anytime",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Unlimited</DialogTitle>
          <DialogDescription>
            You've used your free daily CV generation. Upgrade for unlimited access.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-primary/40 p-6 space-y-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Monthly Plan</h3>
            <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">$9.99</span>
            <span className="text-muted-foreground">/ month</span>
          </div>

          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : "Upgrade Now — $9.99/mo"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Cancel anytime. No further charges after cancellation.
        </p>
      </DialogContent>
    </Dialog>
  );
};
