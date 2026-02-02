import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import type { Message, TailoredOutput } from "@/types";

interface AIChatBoxProps {
  output: TailoredOutput;
  onUpdateOutput: (output: TailoredOutput) => void;
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const AIChatBox = ({ 
  output, 
  onUpdateOutput, 
  messages, 
  onSendMessage,
  isLoading 
}: AIChatBoxProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  };

  const suggestions = [
    "Make the CV more concise",
    "Add more action verbs",
    "Emphasize leadership skills",
    "Make the cover letter more personal",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
    >
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Refine your CV and cover letter</p>
          </div>
        </div>
      </div>

      <div className="h-[300px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Bot className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              Ask me to refine your CV or cover letter. I can help with:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-xs rounded-full bg-primary-light text-primary hover:bg-primary/20 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`
                  max-w-[80%] rounded-2xl px-4 py-3
                  ${message.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-md' 
                    : 'bg-muted text-foreground rounded-bl-md'
                  }
                `}>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to improve your CV or cover letter..."
            className="min-h-[44px] max-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="gradient-primary shadow-primary h-auto"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
