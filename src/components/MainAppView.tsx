import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CVUploader } from "./CVUploader";
import { JobDetailsForm } from "./JobDetailsForm";
import { UserDetailsForm } from "./UserDetailsForm";
import { OutputTypeSelector } from "./OutputTypeSelector";
import { OutputDisplay } from "./OutputDisplay";
import { AIChatBox } from "./AIChatBox";
import { ProcessingStatus } from "./ProcessingStatus";
import type { CVBuildMode } from "./CVModeSelector";
import { UpgradeModal } from "./UpgradeModal";
import { MissingSectionSuggestions } from "./MissingSectionSuggestions";
import { SavedCVs } from "./SavedCVs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CVData,
  JobDescription,
  UserDetails,
  TailoredOutput,
  OutputType,
  Message,
  ChatMode,
  PendingChatAction,
  CVStyle,
  DocumentHeader,
} from "@/types";
import { toast } from "@/hooks/use-toast";
import { parseFunctionError } from "@/lib/errorTracker";
import { Badge } from "@/components/ui/badge";
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

interface MainAppViewProps {
  onBack: () => void;
}

type SubscriptionInfo = {
  plan_type: "free" | "monthly" | "annual";
  status: "active" | "past_due" | "cancelled" | "inactive";
  plan_name?: string | null;
  price?: number | null;
  billing_interval?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

export const MainAppView = ({ onBack }: MainAppViewProps) => {
  const { user } = useAuth();
  const [buildMode, setBuildMode] = useState<CVBuildMode | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [jobInputMethod, setJobInputMethod] = useState<"manual" | "linkedin">("manual");
  const [jobDetails, setJobDetails] = useState<JobDescription>({ 
    title: '', 
    description: '', 
    personSpec: '',
    linkedinUrl: ''
  });
  const [userDetails, setUserDetails] = useState<UserDetails>({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    city: '',
    linkedin: '',
  });
  const [outputType, setOutputType] = useState<OutputType>('both');
  const [output, setOutput] = useState<TailoredOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [cvStyle, setCvStyle] = useState<CVStyle>("standard");
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>(undefined);
  const [hasOneOffPayment, setHasOneOffPayment] = useState(false);
  const [hasUnlimitedGrant, setHasUnlimitedGrant] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    if (typeof window === "undefined") return "instant";
    return (sessionStorage.getItem("cv-chat-mode") as ChatMode) || "instant";
  });
  const [pendingAction, setPendingAction] = useState<PendingChatAction | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [publicUsageSnapshot, setPublicUsageSnapshot] = useState<{ registered: boolean; usedToday: number; remaining: number | null; limit: number | null } | null>(null);
  const [usageSummary, setUsageSummary] = useState<{ used: number; limit: number | null; remaining: number | null } | null>(null);

  const [chatSuggestions, setChatSuggestions] = useState<string[]>([
    "Make the CV more concise",
    "Add more action verbs",
    "Emphasize leadership skills",
    "Make the cover letter more personal",
  ]);

  const isLinkedInMethod = jobInputMethod === "linkedin";
  const hasLinkedInUrl = Boolean(jobDetails.linkedinUrl?.trim());
  const isReadyToProcess = cvData && 
    jobDetails.title && 
    (jobDetails.description || hasLinkedInUrl) && 
    userDetails.fullName && 
    userDetails.email;

  const fetchSubscription = useCallback(async (email: string) => {
    if (!email) return;
    setIsSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-subscription");

      if (error) throw error;
      if (data?.subscription) {
        setSubscriptionInfo(data.subscription);
      }
    } catch (err: any) {
      console.error("Subscription fetch error:", err);
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userDetails.email) {
      setSubscriptionInfo(null);
      return;
    }
    fetchSubscription(userDetails.email);
  }, [userDetails.email, fetchSubscription]);

  useEffect(() => {
    const fetchLoggedInUsage = async () => {
      if (!user) {
        setUsageSummary(null);
        return;
      }
      try {
        const { data } = await supabase.functions.invoke("track-usage", { body: { mode: "check" } });
        if (data) {
          if (data.remaining === null || data.planType) {
            setUsageSummary({ used: Number(data.usedToday ?? 0), remaining: null, limit: null });
          } else {
            setUsageSummary({
              used: Number(data.usedToday ?? 0),
              remaining: Number(data.remaining ?? 0),
              limit: 1,
            });
          }
        }
      } catch (err) {
        console.error("Usage summary error:", err);
      }
    };

    fetchLoggedInUsage();
  }, [user, output]);

  // Check payment status and admin-granted access for logged-in users
  const fetchPaymentStatus = useCallback(async () => {
    if (!user) return;

    // Check if user is admin/super_admin — they get unlimited access
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1);
      if (roleData && roleData.length > 0 && (roleData[0].role === "super_admin" || roleData[0].role === "admin")) {
        setHasUnlimitedGrant(true);
        return;
      }
    } catch {
      // silently fail
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      if (data?.subscribed) setHasOneOffPayment(true);
      if (data?.has_one_off_payment) setHasOneOffPayment(true);
    } catch (err) {
      console.error("Payment status check error:", err);
    }

    // Check admin-granted unlimited access
    if (user.email) {
      try {
        const { data: grantData } = await supabase
          .from("unlimited_access_grants" as any)
          .select("id")
          .eq("user_email", user.email.toLowerCase())
          .eq("is_active", true)
          .limit(1);
        setHasUnlimitedGrant(!!(grantData && (grantData as any[]).length > 0));
      } catch {
        // silently fail
      }
    }
  }, [user]);

  useEffect(() => {
    fetchPaymentStatus();
  }, [fetchPaymentStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    if (!checkoutStatus) return;
    if (checkoutStatus === "success") {
      toast({ title: "Payment successful!", description: "You can now download your CV." });
      if (userDetails.email) {
        fetchSubscription(userDetails.email);
      }
      fetchPaymentStatus();
      setHasOneOffPayment(true);
    }
    if (checkoutStatus === "cancelled") {
      toast({ title: "Checkout cancelled", description: "You can upgrade anytime from the download buttons." });
    }
    params.delete("checkout");
    params.delete("type");
    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [fetchSubscription, fetchPaymentStatus, userDetails.email]);

  const checkUsageLimit = useCallback(async () => {
    if (!userDetails.email) {
      toast({
        title: "Email required",
        description: "Please enter your email before generating a CV revamp.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("track-usage", {
        body: { mode: "check" },
      });

      if (error) throw error;
      if (data?.allowed === false) {
        toast({
          title: "Daily limit reached",
          description: "Upgrade to unlock unlimited CV revamps.",
          variant: "destructive",
        });
        setUpgradeMessage("You've used your free daily limit. Upgrade to unlock unlimited CV revamps.");
        setShowUpgradeModal(true);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error("Usage check error:", err);
      const parsedError = await parseFunctionError(err);
      if (parsedError.code === "ERR_2001_USAGE_LIMIT_REACHED") {
        setUpgradeMessage(parsedError.customerMessage);
        setShowUpgradeModal(true);
      }
      toast({
        title: "Unable to verify usage",
        description: parsedError.customerMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [userDetails.email]);

  const consumeUsage = useCallback(async () => {
    if (!userDetails.email) return;
    try {
      await supabase.functions.invoke("track-usage", {
        body: { mode: "consume" },
      });
    } catch (err) {
      console.error("Usage consume error:", err);
    }
  }, [userDetails.email]);

  const handleCancelSubscription = async () => {
    if (!userDetails.email) return;
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw error;
      if (data?.success) {
        toast({
          title: "Cancellation scheduled",
          description: "Your subscription will cancel at the end of the current billing period.",
        });
        fetchSubscription(userDetails.email);
      }
    } catch (err: any) {
      console.error("Cancel subscription error:", err);
      toast({
        title: "Error",
        description: err.message || "Unable to cancel subscription.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const saveSubmission = async () => {
    try {
      const { error } = await supabase
        .from('user_submissions')
        .insert({
          full_name: userDetails.fullName,
          email: userDetails.email,
          phone: userDetails.phone || null,
          job_title: jobDetails.title,
          job_description: jobDetails.description || 'Via LinkedIn URL',
          person_spec: jobDetails.personSpec || null,
          linkedin_url: jobDetails.linkedinUrl || null,
          cv_filename: cvData?.fileName || null,
          cv_text: cvData?.content || null,
          output_type: outputType,
          service_type: 'CV Revamp',
        });

      if (error) {
        console.error('Error saving submission:', error);
      }
    } catch (err) {
      console.error('Error saving submission:', err);
    }
  };

  const simulateProcessing = useCallback(async (skipAuthPrompt = false) => {
    if (isLinkedInMethod && !hasLinkedInUrl) {
      toast({ title: "LinkedIn URL required", description: "Please paste a LinkedIn job URL to continue.", variant: "destructive" });
      return;
    }

    if (!user && !skipAuthPrompt) {
      const email = userDetails.email.trim().toLowerCase();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!validEmail) {
        toast({ title: "Valid email required", description: "Please enter a valid email before generating your CV.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-public-usage", {
        body: { email },
      });
      if (error) {
        const parsedError = await parseFunctionError(error);
        toast({ title: "Usage check failed", description: parsedError.customerMessage, variant: "destructive" });
        return;
      }

      const usageText = data?.limit === null
        ? `Used today: ${data?.usedToday ?? 0} / Unlimited`
        : `Used today: ${data?.usedToday ?? 0} / ${data?.limit ?? 1}`;

      if (data?.allowed === false) {
        toast({
          title: "Daily limit reached",
          description: `${usageText}. Upgrade to continue today.`,
          variant: "destructive",
        });
        setUpgradeMessage(`${usageText}. Upgrade to continue today.`);
        setShowUpgradeModal(true);
        return;
      }

      setPublicUsageSnapshot({
        registered: Boolean(data?.registered),
        usedToday: Number(data?.usedToday ?? 0),
        remaining: data?.remaining === null ? null : Number(data?.remaining ?? 0),
        limit: data?.limit === null ? null : Number(data?.limit ?? 1),
      });
      setShowAuthPrompt(true);
      return;
    }

    const canProceed = await checkUsageLimit();
    if (!canProceed) return;

    setIsProcessing(true);
    setProgress(0);
    
    // Save user submission to database
    await saveSubmission();
    
    // Stage 1: Initialising (0-10%)
    setProgress(5);
    await new Promise(resolve => setTimeout(resolve, 600));
    setProgress(10);

    // Stage 2: Analysing (10-40%)
    setProgress(15);

    try {
      // Start the actual API call
      const apiPromise = supabase.functions.invoke("revamp-cv", {
        body: {
          cvText: cvData?.content || "",
          jobTitle: jobDetails.title,
          jobDescription: jobDetails.description || "",
          personSpec: jobDetails.personSpec || "",
          userName: userDetails.fullName,
          outputType,
        },
      });

      // Simulate progress while waiting for API
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          // Slow down as we approach higher values
          const increment = prev < 40 ? 3 : prev < 70 ? 2 : 1;
          return Math.min(prev + increment, 85);
        });
      }, 400);

      const { data, error } = await apiPromise;
      clearInterval(progressInterval);

      if (error) {
        const parsedError = await parseFunctionError(error);
        if (parsedError.code === "ERR_2001_USAGE_LIMIT_REACHED") {
          setUpgradeMessage(parsedError.customerMessage);
          setShowUpgradeModal(true);
          toast({
            title: "Daily free trial limit reached",
            description: parsedError.customerMessage,
            variant: "destructive",
          });
          setIsProcessing(false);
          setProgress(0);
          return;
        }
        throw new Error(parsedError.customerMessage);
      }

      if (data?.error) {
        const errMsg = String(data.error).toLowerCase();
        if (errMsg.includes("usage limit") || errMsg.includes("upgrade")) {
          setShowUpgradeModal(true);
          toast({ title: "Free CV revamp allowance used for the day", description: "Upgrade your plan to unlock unlimited CV revamps." });
          setIsProcessing(false);
          setProgress(0);
          return;
        }
        throw new Error(data.error);
      }

      // Stage 4: Formatting (70-90%)
      setProgress(90);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Stage 5: Final checks (90-100%)
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(100);

      const result: TailoredOutput = {
        cv: data?.cv || `# ${jobDetails.title}\n\nYour tailored CV content will appear here.`,
        coverLetter: data?.coverLetter || `Dear Hiring Manager,\n\nYour tailored cover letter will appear here.\n\nBest regards,\n${userDetails.fullName}`,
        suggestions: data?.suggestions || [],
      };

      setOutput(result);
      await consumeUsage();

      // Save CV for logged-in users
      if (user) {
        try {
          await supabase.from("saved_cvs").insert({
            user_id: user.id,
            job_title: jobDetails.title,
            job_description: jobDetails.description || null,
            cv_content: result.cv,
            cover_letter_content: result.coverLetter || null,
            output_type: outputType,
            cv_style: cvStyle,
          } as any);
        } catch (saveErr) {
          console.error("Error saving CV:", saveErr);
        }
      }

      // Brief pause to show "Document Ready!" at 100%
      await new Promise(resolve => setTimeout(resolve, 800));

      toast({
        title: "Success!",
        description: "Your document is ready. Please review or download.",
      });
    } catch (err: any) {
      console.error("CV generation error:", err);
      const parsedError = await parseFunctionError(err);
      if (parsedError.code === "ERR_2001_USAGE_LIMIT_REACHED") {
        setUpgradeMessage(parsedError.customerMessage);
        setShowUpgradeModal(true);
        toast({ title: "Daily free trial limit reached", description: parsedError.customerMessage, variant: "destructive" });
      } else {
        toast({
          title: "Generation failed",
          description: parsedError.customerMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [jobDetails.title, jobDetails.description, jobDetails.personSpec, jobDetails.linkedinUrl, userDetails, cvData, outputType, checkUsageLimit, consumeUsage, user, isLinkedInMethod, hasLinkedInUrl]);

  const applyChatChangesViaAI = async (message: string) => {
    if (!output) return;
    try {
      const { data, error } = await supabase.functions.invoke("refine-cv", {
        body: {
          currentCV: output.cv,
          currentCoverLetter: output.coverLetter,
          userMessage: message,
          jobTitle: jobDetails.title,
          jobDescription: jobDetails.description,
          personSpec: jobDetails.personSpec,
          outputType,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOutput((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cv: data.cv || prev.cv,
          coverLetter: data.coverLetter || prev.coverLetter,
        };
      });

      if (data.followUpSuggestions && data.followUpSuggestions.length > 0) {
        setChatSuggestions(data.followUpSuggestions);
      }

      return data.summary || `Applied your request: "${message}"`;
    } catch (err: any) {
      console.error("Refine CV error:", err);
      toast({
        title: "Refinement failed",
        description: err.message || "Unable to refine the document. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSendMessage = async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    if (pendingAction) {
      setPendingAction(null);
    }

    if (chatMode === "confirm") {
      setIsChatLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      const summary = summarizeRequest(message);
      const createdAt = Date.now();
      const expiresAt = createdAt + 5 * 60 * 1000;
      setPendingAction({
        id: crypto.randomUUID(),
        message,
        summary,
        createdAt,
        expiresAt,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Here's what I'll change:\n${summary.map((item) => `- ${item}`).join("\n")}`,
        },
      ]);
      setIsChatLoading(false);
      return;
    }

    setIsChatLoading(true);
    const summary = await applyChatChangesViaAI(message);
    const response: Message = {
      role: "assistant",
      content: summary
        ? `✅ ${summary}\n\nWould you like to refine anything else?`
        : `I wasn't able to apply that change. Please try rephrasing your request.`,
    };
    setMessages((prev) => [...prev, response]);
    setIsChatLoading(false);
  };

  const handleReset = () => {
    setBuildMode(null);
    setCvData(null);
    setJobDetails({ title: '', description: '', personSpec: '', linkedinUrl: '' });
    setJobInputMethod("manual");
    setUserDetails({ fullName: '', email: '', phone: '', city: '', linkedin: '' });
    setOutput(null);
    setMessages([]);
    setPendingAction(null);
    setCvStyle("standard");
    setChatSuggestions([
      "Make the CV more concise",
      "Add more action verbs",
      "Emphasize leadership skills",
      "Make the cover letter more personal",
    ]);
  };

  const summarizeRequest = (message: string) => {
    const sentences = message
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const summary = sentences.length > 0 ? sentences : [message];
    return summary.slice(0, 3).map((item) => item.replace(/^to\s+/i, ""));
  };

  const handleProceed = async () => {
    if (!pendingAction) return;
    setIsChatLoading(true);
    const summary = await applyChatChangesViaAI(pendingAction.message);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: summary
          ? `✅ ${summary}\n\nLet me know if you'd like more changes.`
          : "I wasn't able to apply that change. Please try rephrasing.",
      },
    ]);
    setPendingAction(null);
    setIsChatLoading(false);
  };

  const handleCancel = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "No changes were applied. Let me know if you'd like to try something else." },
    ]);
  };

  const handleEditRequest = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Sure — update your request below when you're ready." },
    ]);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cv-chat-mode", chatMode);
    }
    if (chatMode === "instant" && pendingAction) {
      setPendingAction(null);
    }
  }, [chatMode, pendingAction]);

  useEffect(() => {
    if (!pendingAction) return;
    const delay = Math.max(pendingAction.expiresAt - Date.now(), 0);
    const timeout = window.setTimeout(() => {
      setPendingAction((current) => {
        if (!current) return null;
        if (Date.now() >= current.expiresAt) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Your pending change request expired. Please send a new request." },
          ]);
          return null;
        }
        return current;
      });
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [pendingAction]);

  const documentHeader = useMemo<DocumentHeader>(
    () => ({
      name: userDetails.fullName || "Your Name",
      phone: userDetails.phone || "Phone Number",
      email: userDetails.email || "Email Address",
      role: jobDetails.title || "Target Role",
      location: userDetails.city || "",
      linkedin: userDetails.linkedin || "",
    }),
    [userDetails.fullName, userDetails.phone, userDetails.email, userDetails.city, userDetails.linkedin, jobDetails.title]
  );

  // Check if we have enough details to enter guided mode
  const hasBasicDetails = userDetails.fullName && userDetails.email && jobDetails.title;

  const planLabel = subscriptionInfo?.plan_type === "monthly"
    ? "Unlimited – Monthly"
    : subscriptionInfo?.plan_type === "annual"
    ? "Unlimited – Annual"
    : "Free";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => {
              if (buildMode && !output) {
                setBuildMode(null);
                return;
              }
              onBack();
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {buildMode && !output ? "Back" : "Back to Home"}
          </Button>

          {output && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Start Over
            </Button>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto"
            >
              <ProcessingStatus progress={progress} />
            </motion.div>
          ) : output ? (
            <motion.div
              key="output"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              <OutputDisplay
                output={output}
                outputType={outputType}
                header={documentHeader}
                cvStyle={cvStyle}
                onStyleChange={setCvStyle}
                onDownloadBlocked={() => setShowUpgradeModal(true)}
                canDownload={
                  hasUnlimitedGrant ||
                  hasOneOffPayment ||
                  subscriptionInfo?.status === "active" ||
                  subscriptionInfo?.plan_type === "monthly" ||
                  subscriptionInfo?.plan_type === "annual"
                }
              />
              <div className="space-y-0">
                <AIChatBox
                  output={output}
                  onUpdateOutput={setOutput}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isChatLoading}
                  chatMode={chatMode}
                  onModeChange={setChatMode}
                  pendingAction={pendingAction}
                  onProceed={handleProceed}
                  onCancel={handleCancel}
                  onEditRequest={handleEditRequest}
                  suggestions={chatSuggestions}
                />
                {output.suggestions && output.suggestions.length > 0 && (
                  <MissingSectionSuggestions
                    suggestions={output.suggestions}
                    onAddSection={(suggestion) => {
                      setOutput((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          cv: `${prev.cv}\n\n## ${suggestion.section}\n${suggestion.suggestedContent}`,
                        };
                      });
                    }}
                  />
                )}
              </div>
            </motion.div>
          ) : !buildMode ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Let's Tailor Your CV
                </h2>
                <p className="text-muted-foreground">
                  Fill in your details and job information, then choose how to build your CV.
                </p>
                {user && usageSummary && (
                  <div className="mt-3 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {usageSummary.limit === null
                      ? `Usage today: ${usageSummary.used} / Unlimited`
                      : `Usage today: ${usageSummary.used}/${usageSummary.limit} • ${usageSummary.remaining} left`}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {/* Step 1: Your Details */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Step 1: Your Details</h3>
                  <UserDetailsForm
                    userDetails={userDetails}
                    onChange={setUserDetails}
                  />
                </div>

                {/* Step 2: Job Details */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Step 2: Add Job Details</h3>
                  <JobDetailsForm
                    jobDetails={jobDetails}
                    onChange={setJobDetails}
                    inputMethod={jobInputMethod}
                    onInputMethodChange={setJobInputMethod}
                  />
                </div>

                {/* Step 3: Continue */}
                <div className="pt-4">
                  {hasBasicDetails ? (
                    <div className="text-center">
                      <Button
                        size="lg"
                        className="gap-2 gradient-primary text-primary-foreground shadow-primary px-8"
                        onClick={() => setBuildMode("revamp")}
                      >
                        <Sparkles className="w-5 h-5" />
                        Continue with AI CV Revamp
                      </Button>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      Please fill in your details and job title to continue
                    </p>
                  )}
                </div>

                {/* Saved CVs for logged-in users */}
                {user && (
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <SavedCVs />
                  </div>
                )}
              </div>
            </motion.div>
          ) : buildMode === "revamp" ? (
            <motion.div
              key="revamp-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  AI Full CV Revamp
                </h2>
                <p className="text-muted-foreground">
                  Upload your CV and choose your output type. AI will tailor everything for you.
                </p>
                {user && usageSummary && (
                  <div className="mt-3 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {usageSummary.limit === null
                      ? `Usage today: ${usageSummary.used} / Unlimited`
                      : `Usage today: ${usageSummary.used}/${usageSummary.limit} • ${usageSummary.remaining} left`}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {/* Upload CV */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Upload Your CV</h3>
                  <CVUploader
                    onUpload={setCvData}
                    cvData={cvData}
                    onClear={() => setCvData(null)}
                  />
                </div>

                {/* Output Type */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Choose Output</h3>
                  <OutputTypeSelector
                    selected={outputType}
                    onChange={setOutputType}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isReadyToProcess ? 1 : 0.5 }}
                  className="pt-4"
                >
                  <Button
                    size="lg"
                    onClick={simulateProcessing}
                    disabled={!isReadyToProcess}
                    className="w-full gradient-primary shadow-primary hover:opacity-90 transition-opacity h-14 text-lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Tailored Documents
                  </Button>
                  {!isReadyToProcess && (
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      Please upload your CV to continue
                    </p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{publicUsageSnapshot?.registered ? "Sign in to continue" : "Create your account to continue"}</DialogTitle>
              <DialogDescription>
                Email: {userDetails.email}

                {publicUsageSnapshot && (
                  <span className="block mt-2">
                    {publicUsageSnapshot.limit === null
                      ? `Usage today: ${publicUsageSnapshot.usedToday} / Unlimited`
                      : `Usage today: ${publicUsageSnapshot.usedToday}/${publicUsageSnapshot.limit} • ${publicUsageSnapshot.remaining} left`}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="quick-password">Password</Label>
              <Input
                id="quick-password"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter a password"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAuthPrompt(false)} disabled={isAuthSubmitting}>Cancel</Button>
              <Button
                disabled={isAuthSubmitting || authPassword.length < 6}
                onClick={async () => {
                  setIsAuthSubmitting(true);
                  const email = userDetails.email.trim().toLowerCase();
                  try {
                    if (publicUsageSnapshot?.registered) {
                      const { error } = await supabase.auth.signInWithPassword({ email, password: authPassword });
                      if (error) throw error;
                    } else {
                      const { data, error } = await supabase.auth.signUp({
                        email,
                        password: authPassword,
                        options: { data: { full_name: userDetails.fullName || email.split("@")[0] } },
                      });
                      if (error) throw error;
                      if (!data.session) {
                        toast({ title: "Check your email", description: "Please verify your email, then sign in to continue.", variant: "destructive" });
                        setIsAuthSubmitting(false);
                        return;
                      }
                    }

                    setShowAuthPrompt(false);
                    setAuthPassword("");
                    await simulateProcessing(true);
                  } catch (err: any) {
                    toast({ title: "Authentication failed", description: err.message || "Please check your password and try again.", variant: "destructive" });
                  } finally {
                    setIsAuthSubmitting(false);
                  }
                }}
              >
                {isAuthSubmitting ? "Please wait..." : publicUsageSnapshot?.registered ? "Sign in & generate" : "Create account & generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          usageMessage={upgradeMessage}
        />
      </div>
    </div>
  );
};
