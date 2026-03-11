import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageMessage?: string;
}

export const UpgradeModal = ({ open, onOpenChange, usageMessage }: UpgradeModalProps) => {
  const [isLoading, setIsLoading] = useState<"subscription" | null>(null);

  const handleCheckout = async () => {
    setIsLoading("subscription");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { mode: "subscription" },
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
      <DialogContent className="max-w-xl border-border/60 bg-[#171717] text-white">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-orange-400 to-violet-500 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <DialogTitle className="text-4xl leading-tight text-white">Daily limit reached</DialogTitle>
          <DialogDescription className="text-lg text-white/80 pt-2">
            {usageMessage || "You've used today's free credits. Upgrade to keep building."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-white/15 p-6 space-y-4 bg-[#1b1b1b]">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-300" />
            <p className="text-xl font-semibold">Upgrade plan</p>
          </div>
          <p className="text-5xl font-bold">£9.99 <span className="text-2xl font-normal text-white/75">per month</span></p>

          <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
            <p className="text-lg font-medium">You will unlock:</p>
            {[
              "Unlimited CV revamps",
              "Unlimited AI suggestions",
              "PDF + Word downloads",
              "Cover letter generation",
              "Cancel anytime",
            ].map((item) => (
              <p key={item} className="flex items-center gap-2 text-white/90">
                <Check className="w-4 h-4 text-emerald-300" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-white text-black hover:bg-white/90" onClick={handleCheckout} disabled={isLoading !== null}>
            {isLoading ? "Redirecting..." : "Upgrade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
