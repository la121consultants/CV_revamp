import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CVUploader } from "./CVUploader";
import { JobDetailsForm } from "./JobDetailsForm";
import { UserDetailsForm } from "./UserDetailsForm";
import { OutputTypeSelector } from "./OutputTypeSelector";
import { OutputDisplay } from "./OutputDisplay";
import { AIChatBox } from "./AIChatBox";
import { ProcessingStatus } from "./ProcessingStatus";
import { CVModeSelector, type CVBuildMode } from "./CVModeSelector";
import { GuidedCVBuilder } from "./GuidedCVBuilder";
import { UpgradeModal } from "./UpgradeModal";
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
  const [jobDetails, setJobDetails] = useState<JobDescription>({ 
    title: '', 
    description: '', 
    personSpec: '',
    linkedinUrl: ''
  });
  const [userDetails, setUserDetails] = useState<UserDetails>({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: ''
  });
  const [outputType, setOutputType] = useState<OutputType>('both');
  const [output, setOutput] = useState<TailoredOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'processing' | 'generating'>('analyzing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [cvStyle, setCvStyle] = useState<CVStyle>("standard");
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    if (typeof window === "undefined") return "instant";
    return (sessionStorage.getItem("cv-chat-mode") as ChatMode) || "instant";
  });
  const [pendingAction, setPendingAction] = useState<PendingChatAction | null>(null);

  const isLinkedInMethod = !!jobDetails.linkedinUrl && jobDetails.linkedinUrl.includes('linkedin.com');
  const isReadyToProcess = cvData && 
    jobDetails.title && 
    (jobDetails.description || isLinkedInMethod) && 
    userDetails.fullName && 
    userDetails.email;

  const fetchSubscription = useCallback(async (email: string) => {
    if (!email) return;
    setIsSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-subscription", {
        body: { userEmail: email },
      });

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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    if (!checkoutStatus) return;
    if (checkoutStatus === "success") {
      toast({ title: "Subscription active", description: "Your unlimited CV revamps are now unlocked." });
      if (userDetails.email) {
        fetchSubscription(userDetails.email);
      }
    }
    if (checkoutStatus === "cancelled") {
      toast({ title: "Checkout cancelled", description: "You can upgrade anytime from the upgrade prompt." });
    }
    params.delete("checkout");
    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [fetchSubscription, userDetails.email]);

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
        body: { userEmail: userDetails.email, mode: "check" },
      });

      if (error) throw error;
      if (data?.allowed === false) {
        toast({
          title: "Daily limit reached",
          description: "Upgrade to unlock unlimited CV revamps.",
          variant: "destructive",
        });
        setShowUpgradeModal(true);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error("Usage check error:", err);
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("usage limit") || message.includes("402")) {
        setShowUpgradeModal(true);
      }
      toast({
        title: "Error",
        description: err.message || "Unable to verify usage limits.",
        variant: "destructive",
      });
      return false;
    }
  }, [userDetails.email]);

  const consumeUsage = useCallback(async () => {
    if (!userDetails.email) return;
    try {
      await supabase.functions.invoke("track-usage", {
        body: { userEmail: userDetails.email, mode: "consume" },
      });
    } catch (err) {
      console.error("Usage consume error:", err);
    }
  }, [userDetails.email]);

  const handleCancelSubscription = async () => {
    if (!userDetails.email) return;
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { userEmail: userDetails.email },
      });
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
          output_type: outputType,
          service_type: buildMode === 'guided' ? 'AI Suggestions' : 'CV Revamp',
        });

      if (error) {
        console.error('Error saving submission:', error);
      }
    } catch (err) {
      console.error('Error saving submission:', err);
    }
  };

  const simulateProcessing = useCallback(async () => {
    // Check usage limit BEFORE processing — upgrade modal only appears here
    const allowed = await checkUsageLimit();
    if (!allowed) return;

    setIsProcessing(true);
    
    // Save user submission to database
    await saveSubmission();
    
    setProcessingStage('analyzing');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProcessingStage('processing');

    try {
      const { data, error } = await supabase.functions.invoke("revamp-cv", {
        body: {
          cvText: cvData?.content || "",
          jobTitle: jobDetails.title,
          jobDescription: jobDetails.description || "",
          personSpec: jobDetails.personSpec || "",
          userName: userDetails.fullName,
          userEmail: userDetails.email,
          outputType,
        },
      });

      if (error) {
        const msg = String(error.message || "").toLowerCase();
        if (msg.includes("usage limit") || msg.includes("402")) {
          setShowUpgradeModal(true);
          toast({ title: "Daily limit reached", description: "Upgrade to unlock unlimited CV revamps.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        throw error;
      }

      if (data?.error) {
        if (data.error.includes("Usage limit") || data.error.includes("upgrade")) {
          setShowUpgradeModal(true);
          toast({ title: "Daily limit reached", description: "Upgrade to unlock unlimited CV revamps.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        throw new Error(data.error);
      }

      setProcessingStage('generating');
      await new Promise(resolve => setTimeout(resolve, 500));

      const result: TailoredOutput = {
        cv: data?.cv || `# ${jobDetails.title}\n\nYour tailored CV content will appear here.`,
        coverLetter: data?.coverLetter || `Dear Hiring Manager,\n\nYour tailored cover letter will appear here.\n\nBest regards,\n${userDetails.fullName}`,
      };

      setOutput(result);

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

      // Consume usage after successful generation
      await consumeUsage();
      
      toast({
        title: "Success!",
        description: "Your tailored documents are ready.",
      });
    } catch (err: any) {
      console.error("CV generation error:", err);
      toast({
        title: "Generation failed",
        description: err.message || "Unable to generate your CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [jobDetails.title, jobDetails.description, jobDetails.personSpec, jobDetails.linkedinUrl, userDetails, cvData, outputType]);

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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    applyChatChanges(message);
    const response: Message = {
      role: "assistant",
      content: `I've applied your request: "${message}". I've updated your CV/cover letter to reflect it. Want to refine anything else?`,
    };

    setMessages((prev) => [...prev, response]);
    setIsChatLoading(false);
  };

  const handleReset = () => {
    setBuildMode(null);
    setCvData(null);
    setJobDetails({ title: '', description: '', personSpec: '', linkedinUrl: '' });
    setUserDetails({ fullName: '', email: '', phone: '' });
    setOutput(null);
    setMessages([]);
    setPendingAction(null);
    setCvStyle("standard");
  };

  const applyChatChanges = (message: string) => {
    const updateNote = `\n\n## Update Notes\n- ${message}`;
    const letterNote = `\n\nRequested updates: ${message}`;
    setOutput((prev) => {
      if (!prev) return prev;
      return {
        cv: `${prev.cv}${updateNote}`,
        coverLetter: `${prev.coverLetter}${letterNote}`,
      };
    });
  };

  const summarizeRequest = (message: string) => {
    const sentences = message
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const summary = sentences.length > 0 ? sentences : [message];
    return summary.slice(0, 3).map((item) => item.replace(/^to\s+/i, ""));
  };

  const handleProceed = () => {
    if (!pendingAction) return;
    applyChatChanges(pendingAction.message);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Updates applied. Let me know if you'd like more changes." },
    ]);
    setPendingAction(null);
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
    }),
    [userDetails.fullName, userDetails.phone, userDetails.email, jobDetails.title]
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
              if (buildMode === "guided" && !output) {
                setBuildMode(null);
                return;
              }
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

          {(output || buildMode === "guided") && (
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
              <ProcessingStatus stage={processingStage} />
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
              />
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
              />
            </motion.div>
          ) : buildMode === "guided" ? (
            <motion.div
              key="guided"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {userDetails.email && (
                <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Subscription</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-foreground">{planLabel}</p>
                        {subscriptionInfo?.status === "active" && (
                          <Badge variant="secondary">Unlimited</Badge>
                        )}
                      </div>
                      {subscriptionInfo?.cancel_at_period_end && subscriptionInfo?.current_period_end && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Cancellation scheduled for {new Date(subscriptionInfo.current_period_end).toLocaleDateString("en-GB")}.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subscriptionInfo?.status === "active" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Cancel subscription
                            </Button>
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
                      ) : (
                        <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <GuidedCVBuilder
                userName={userDetails.fullName}
                userEmail={userDetails.email}
                userPhone={userDetails.phone}
                jobTitle={jobDetails.title}
                jobDescription={jobDetails.description}
                onUsageLimit={() => setShowUpgradeModal(true)}
              />
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
              </div>

              <div className="space-y-8">
                {/* Step 1: Your Details */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Step 1: Your Details</h3>
                  <UserDetailsForm
                    userDetails={userDetails}
                    onChange={setUserDetails}
                  />
                  {userDetails.email && (
                    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Subscription</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{planLabel}</p>
                            {isSubscriptionLoading && (
                              <span className="text-xs text-muted-foreground">Checking...</span>
                            )}
                          </div>
                          {subscriptionInfo?.status === "past_due" && (
                            <p className="text-xs text-destructive mt-1">Payment issue — update your plan to restore access.</p>
                          )}
                          {subscriptionInfo?.cancel_at_period_end && subscriptionInfo?.current_period_end && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cancellation scheduled for {new Date(subscriptionInfo.current_period_end).toLocaleDateString("en-GB")}.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {subscriptionInfo?.status === "active" ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Cancel subscription
                                </Button>
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
                          ) : (
                            <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
                              Upgrade
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Job Details */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Step 2: Add Job Details</h3>
                  <JobDetailsForm
                    jobDetails={jobDetails}
                    onChange={setJobDetails}
                  />
                </div>

                {/* Step 3: Choose Mode */}
                <div className="pt-4">
                  {hasBasicDetails ? (
                    <CVModeSelector
                      onSelect={(mode) => {
                        if (mode === "guided") {
                          setBuildMode("guided");
                        } else {
                          setBuildMode("revamp");
                        }
                      }}
                    />
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
              </div>

              <div className="space-y-8">
                {userDetails.email && (
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Subscription</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{planLabel}</p>
                          {subscriptionInfo?.status === "active" && (
                            <Badge variant="secondary">Unlimited</Badge>
                          )}
                        </div>
                        {subscriptionInfo?.cancel_at_period_end && subscriptionInfo?.current_period_end && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cancellation scheduled for {new Date(subscriptionInfo.current_period_end).toLocaleDateString("en-GB")}.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subscriptionInfo?.status === "active" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Cancel subscription
                              </Button>
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
                        ) : (
                          <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
                            Upgrade
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          userEmail={userDetails.email}
        />
      </div>
    </div>
  );
};
