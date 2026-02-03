import { useState, useCallback, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import type {
  CVData,
  JobDescription,
  UserDetails,
  TailoredOutput,
  OutputType,
  Message,
  ChatMode,
  PendingChatAction,
} from "@/types";
import { toast } from "@/hooks/use-toast";

interface MainAppViewProps {
  onBack: () => void;
}

export const MainAppView = ({ onBack }: MainAppViewProps) => {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDescription>({ 
    title: '', 
    description: '', 
    personSpec: '',
    linkedinUrl: ''
  });
  const [userDetails, setUserDetails] = useState<UserDetails>({
    fullName: '',
    email: '',
    phone: ''
  });
  const [outputType, setOutputType] = useState<OutputType>('both');
  const [output, setOutput] = useState<TailoredOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'processing' | 'generating'>('analyzing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
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
          output_type: outputType
        });

      if (error) {
        console.error('Error saving submission:', error);
      }
    } catch (err) {
      console.error('Error saving submission:', err);
    }
  };

  const simulateProcessing = useCallback(async () => {
    setIsProcessing(true);
    
    // Save user submission to database
    await saveSubmission();
    
    setProcessingStage('analyzing');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setProcessingStage('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessingStage('generating');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const simulatedOutput: TailoredOutput = {
      cv: `# ${jobDetails.title}

## Professional Summary
Experienced professional with a proven track record in delivering results. Skilled in adapting to new challenges and driving innovation.

## Key Skills
- **Leadership**: Demonstrated ability to lead cross-functional teams
- **Communication**: Excellent written and verbal communication skills
- **Problem Solving**: Strong analytical and critical thinking abilities
- **Technical Expertise**: Proficient in industry-standard tools and methodologies

## Professional Experience

### Current Position
*Tailored based on job requirements*

Successfully implemented strategic initiatives that align with the role's requirements. Key achievements include:
- Delivered projects on time and within budget
- Collaborated with stakeholders to achieve business objectives
- Drove continuous improvement initiatives

## Education
Relevant qualifications aligned with position requirements.

---
*This CV has been tailored for the ${jobDetails.title} position*`,
      
      coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in the **${jobDetails.title}** position. After carefully reviewing the job description, I am confident that my skills and experience make me an excellent candidate for this role.

## Why I'm a Great Fit

Throughout my career, I have developed a comprehensive skill set that directly aligns with your requirements. My experience has equipped me with:

- **Relevant Industry Experience**: I bring hands-on experience that matches the core responsibilities outlined in your job description.
- **Proven Track Record**: I have consistently delivered results and exceeded expectations in similar roles.
- **Adaptability**: I thrive in dynamic environments and quickly adapt to new challenges.

## What I Can Bring to Your Team

I am particularly excited about this opportunity because it aligns perfectly with my career goals and expertise. I am eager to contribute to your organization's success by:

- Applying my skills to drive meaningful results
- Collaborating effectively with team members
- Bringing fresh perspectives and innovative solutions

I would welcome the opportunity to discuss how my background and skills would benefit your team. Thank you for considering my application.

Best regards,
${userDetails.fullName}

---
*This cover letter has been tailored for the ${jobDetails.title} position*`
    };

    setOutput(simulatedOutput);
    setIsProcessing(false);
    
    toast({
      title: "Success!",
      description: "Your tailored documents are ready.",
    });
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
    setCvData(null);
    setJobDetails({ title: '', description: '', personSpec: '', linkedinUrl: '' });
    setUserDetails({ fullName: '', email: '', phone: '' });
    setOutput(null);
    setMessages([]);
    setPendingAction(null);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
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
          ) : (
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
                  Upload your CV, add the job details, and let AI do the rest.
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
                </div>

                {/* Step 2: Upload CV */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Step 2: Upload Your CV</h3>
                  <CVUploader 
                    onUpload={setCvData} 
                    cvData={cvData} 
                    onClear={() => setCvData(null)} 
                  />
                </div>

                {/* Step 3: Job Details */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Step 3: Add Job Details</h3>
                  <JobDetailsForm 
                    jobDetails={jobDetails} 
                    onChange={setJobDetails} 
                  />
                </div>

                {/* Step 4: Output Type */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Step 4: Choose Output</h3>
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
                      Please fill in your details, upload your CV, and add the job information to continue
                    </p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
