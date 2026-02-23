import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<"oneoff" | "subscription" | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.email) {
      setIsCheckingSubscription(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("get-subscription");
      if (!error && data?.subscription) {
        setSubscriptionInfo(data.subscription);
      }
    } catch {
      // silently fail
    } finally {
      setIsCheckingSubscription(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleCheckout = async (mode: "payment" | "subscription") => {
    // Subscriptions require login; one-off payments do not
    if (mode === "subscription" && !user) {
      toast({ title: "Sign in required", description: "Please sign in to subscribe." });
      navigate("/login?redirect=/subscription");
      return;
    }
    setIsLoading(mode === "payment" ? "oneoff" : "subscription");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { mode },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Unable to start checkout.");
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message || "Unable to start checkout.", variant: "destructive" });
    } finally {
      setIsLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.email) return;
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Cancellation scheduled", description: "Your subscription will cancel at the end of the current billing period." });
        fetchSubscription();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Unable to cancel subscription.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const isSubscribed = subscriptionInfo?.status === "active";
  const planLabel = subscriptionInfo?.plan_type === "monthly"
    ? "Unlimited – Monthly"
    : subscriptionInfo?.plan_type === "annual"
    ? "Unlimited – Annual"
    : "Free";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>

            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Choose Your Plan
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start with a free CV revamp every day, or upgrade for unlimited access.
              </p>
            </div>

            {/* Current plan banner */}
            {user && !isCheckingSubscription && (
              <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{planLabel}</p>
                      {isSubscribed && <Badge variant="secondary">Active</Badge>}
                    </div>
                    {subscriptionInfo?.cancel_at_period_end && subscriptionInfo?.current_period_end && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cancellation scheduled for {new Date(subscriptionInfo.current_period_end).toLocaleDateString("en-GB")}.
                      </p>
                    )}
                  </div>
                  {isSubscribed && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">Cancel subscription</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your plan will remain active until the end of the current billing period, and no further charges will occur.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelSubscription} disabled={isCancelling}>
                            {isCancelling ? "Cancelling..." : "Confirm cancellation"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}

            {isCheckingSubscription ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Free tier */}
                <div className={`rounded-2xl border p-6 space-y-4 ${!isSubscribed ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
                  {!isSubscribed && <Badge className="mb-2">Current Plan</Badge>}
                  <h3 className="text-xl font-bold text-foreground">Free</h3>
                  <p className="text-3xl font-bold text-foreground">£0</p>
                  <p className="text-sm text-muted-foreground">per day</p>
                  <ul className="space-y-2">
                    {["1 free CV revamp per day", "Preview before download", "All templates"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pay per CV */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-foreground" />
                    <h3 className="text-xl font-bold text-foreground">Pay Per CV</h3>
                  </div>
                  <p className="text-3xl font-bold text-foreground">£1</p>
                  <p className="text-sm text-muted-foreground">one-off</p>
                  <ul className="space-y-2">
                    {["Single CV revision & download", "All templates & colour palettes", "PDF & Word downloads"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCheckout("payment")}
                    disabled={isLoading !== null}
                  >
                    {isLoading === "oneoff" ? "Redirecting..." : "Pay £1 for One CV"}
                  </Button>
                </div>

                {/* Unlimited */}
                <div className={`rounded-2xl border p-6 space-y-4 ${isSubscribed ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
                  {isSubscribed && <Badge className="mb-2">Your Plan</Badge>}
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-foreground">Unlimited</h3>
                  </div>
                  <p className="text-3xl font-bold text-foreground">£9.99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2">
                    {[
                      "Unlimited CV revamps per day",
                      "Unlimited AI suggestions",
                      "All templates & colour palettes",
                      "PDF & Word downloads",
                      "AI cover letter generation",
                      "Cancel anytime",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {!isSubscribed && (
                    <Button
                      className="w-full"
                      onClick={() => handleCheckout("subscription")}
                      disabled={isLoading !== null}
                    >
                      {isLoading === "subscription" ? "Redirecting..." : "Subscribe — £9.99/mo"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
