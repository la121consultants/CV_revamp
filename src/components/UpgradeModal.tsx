import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export const UpgradeModal = ({ open, onOpenChange, userEmail }: UpgradeModalProps) => {
  const [isLoading, setIsLoading] = useState<"monthly" | "annual" | null>(null);

  const handleCheckout = async (planType: "monthly" | "annual") => {
    if (!userEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email before upgrading.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { planType, userEmail },
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
      setIsLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upgrade to Unlimited CV Revamps</DialogTitle>
          <DialogDescription>
            Choose a plan that fits you best. Cancel anytime — no further charges after cancellation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-5 space-y-3 bg-background">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Monthly</h3>
              <Badge variant="secondary">Cancel anytime</Badge>
            </div>
            <p className="text-3xl font-bold text-foreground">£16.99</p>
            <p className="text-sm text-muted-foreground">per month</p>
            <Button
              className="w-full"
              onClick={() => handleCheckout("monthly")}
              disabled={isLoading !== null}
            >
              {isLoading === "monthly" ? "Redirecting..." : "Upgrade Monthly"}
            </Button>
          </div>

          <div className="rounded-xl border border-primary/40 p-5 space-y-3 bg-primary/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Annual</h3>
              <Badge className="bg-primary text-primary-foreground">Best value</Badge>
            </div>
            <p className="text-3xl font-bold text-foreground">£149</p>
            <p className="text-sm text-muted-foreground">per year</p>
            <Button
              className="w-full"
              onClick={() => handleCheckout("annual")}
              disabled={isLoading !== null}
            >
              {isLoading === "annual" ? "Redirecting..." : "Upgrade Annual"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          No further charges after cancellation. You keep unlimited access until the current billing period ends.
        </p>
      </DialogContent>
    </Dialog>
  );
};
