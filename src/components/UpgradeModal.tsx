import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const [isLoading, setIsLoading] = useState<"oneoff" | "subscription" | null>(null);
  const handleCheckout = async (mode: "payment" | "subscription") => {
    setIsLoading(mode === "payment" ? "oneoff" : "subscription");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { mode },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Unable to start checkout.");

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Free Daily CV Is Used</DialogTitle>
          <DialogDescription>
            Choose how you'd like to continue building CVs today.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* One-off option */}
          <div className="rounded-xl border border-border p-5 space-y-3 bg-background">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <CreditCard className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pay Per CV</h3>
                <p className="text-sm text-muted-foreground">One-off download</p>
              </div>
              <span className="ml-auto text-2xl font-bold text-foreground">£1</span>
            </div>
            <ul className="space-y-1">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary" />
                Single CV revision & download
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary" />
                All templates & colour palettes
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleCheckout("payment")}
              disabled={isLoading !== null}
            >
              {isLoading === "oneoff" ? "Redirecting..." : "Pay £1 for This CV"}
            </Button>
          </div>

          {/* Subscription option */}
          <div className="rounded-xl border border-primary/40 p-5 space-y-3 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Unlimited Plan</h3>
                <p className="text-sm text-muted-foreground">Best value</p>
              </div>
              <div className="ml-auto text-right">
                <span className="text-2xl font-bold text-foreground">£9.99</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
            </div>
            <ul className="space-y-1">
              {[
                "Unlimited CV revamps per day",
                "Unlimited AI suggestions",
                "All templates & colour palettes",
                "PDF & Word downloads",
                "AI cover letter generation",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleCheckout("subscription")}
              disabled={isLoading !== null}
            >
              {isLoading === "subscription" ? "Redirecting..." : "Subscribe — £9.99/mo"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Cancel anytime. No further charges after cancellation.
        </p>
      </DialogContent>
    </Dialog>
  );
};
