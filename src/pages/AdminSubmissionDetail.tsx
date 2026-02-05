import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Globe, 
  Briefcase, 
  Calendar,
  FileText,
  Save,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface SubmissionDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  target_role: string | null;
  job_title: string;
  job_description: string;
  person_spec: string | null;
  service_type: string | null;
  status: string | null;
  internal_notes: string | null;
  cv_filename: string | null;
  cv_text: string | null;
  output_type: string;
  created_at: string;
}

const statusOptions = [
  { value: "New", label: "New" },
  { value: "In Review", label: "In Review" },
  { value: "Completed", label: "Completed" },
];

const AdminSubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>("New");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isSuperAdmin) {
      navigate("/");
    }
  }, [isSuperAdmin, authLoading, user, navigate]);

  useEffect(() => {
    if (id && isSuperAdmin) {
      fetchSubmission();
    }
  }, [id, isSuperAdmin]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from("user_submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      const submissionData = data as SubmissionDetail;
      setSubmission(submissionData);
      setStatus(submissionData.status || "New");
      setInternalNotes(submissionData.internal_notes || "");
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast({
        title: "Error",
        description: "Failed to load submission details",
        variant: "destructive",
      });
      navigate("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_submissions")
        .update({
          status,
          internal_notes: internalNotes,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Submission updated successfully",
      });
    } catch (error) {
      console.error("Error saving submission:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 glass sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LA121 Consultants" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Submission Details</h1>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate("/admin")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* User Info Card */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{submission.full_name}</h2>
                <p className="text-muted-foreground">{submission.target_role || submission.job_title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status === "Completed" ? "bg-green-500/10 text-green-500" :
                  status === "In Review" ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-blue-500/10 text-blue-500"
                }`}>
                  {status}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${submission.email}`} className="text-primary hover:underline">
                  {submission.email}
                </a>
              </div>
              {submission.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{submission.phone}</span>
                </div>
              )}
              {submission.city && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{submission.city}</span>
                </div>
              )}
              {submission.linkedin_url && (
                <div className="flex items-center gap-3 text-sm">
                  <Linkedin className="w-4 h-4 text-muted-foreground" />
                  <a href={submission.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    {submission.linkedin_url}
                  </a>
                </div>
              )}
              {submission.portfolio_url && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href={submission.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    {submission.portfolio_url}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span>{submission.service_type || submission.output_type}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(submission.created_at).toLocaleString()}</span>
              </div>
              {submission.cv_filename && (
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{submission.cv_filename}</span>
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Job Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {submission.job_description}
            </p>
          </div>

          {/* Person Spec */}
          {submission.person_spec && (
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Person Specification</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {submission.person_spec}
              </p>
            </div>
          )}

          {/* CV Text */}
          {submission.cv_text && (
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">CV Content</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                {submission.cv_text}
              </p>
            </div>
          )}

          {/* Admin Controls */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Admin Controls</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Internal Notes (Admin Only)</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Add private notes about this submission..."
                  className="min-h-[120px]"
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="gap-2 gradient-primary">
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminSubmissionDetail;
