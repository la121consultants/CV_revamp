import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Trash2, Clock, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { renderDocumentRequest, downloadDocumentRequest } from "@/lib/documentApi";
import type { CVStyle, DocumentHeader } from "@/types";

interface SavedCV {
  id: string;
  job_title: string;
  job_description: string | null;
  cv_content: string;
  cover_letter_content: string | null;
  output_type: string;
  cv_style: string | null;
  created_at: string;
}

export const SavedCVs = () => {
  const { user } = useAuth();
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSavedCVs();
  }, [user]);

  const fetchSavedCVs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_cvs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved CVs:", error);
    } else {
      setSavedCVs((data as SavedCV[]) || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_cvs").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete CV.", variant: "destructive" });
    } else {
      setSavedCVs((prev) => prev.filter((cv) => cv.id !== id));
      toast({ title: "Deleted", description: "CV removed from your history." });
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (cv: SavedCV, format: "docx" | "pdf") => {
    setDownloadingId(cv.id);
    try {
      const header: DocumentHeader = {
        name: user?.user_metadata?.full_name || "Your Name",
        phone: "",
        email: user?.email || "",
        role: cv.job_title,
      };
      const rendered = await renderDocumentRequest(
        cv.cv_content,
        "cv",
        format,
        header,
        (cv.cv_style as CVStyle) || "standard"
      );
      const cached = downloadDocumentRequest(rendered.id, format);
      triggerDownload(cached.blob, cached.fileName);
    } catch (err) {
      console.error(err);
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">Loading your CVs...</div>
    );
  }

  if (savedCVs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">No saved CVs yet. Generate your first CV to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Your Previous CVs
      </h3>
      <AnimatePresence>
        {savedCVs.map((cv) => (
          <motion.div
            key={cv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary shrink-0" />
                <p className="font-medium text-foreground truncate">{cv.job_title}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(cv.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(cv, "docx")}
                disabled={downloadingId === cv.id}
                className="gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Word
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(cv, "pdf")}
                disabled={downloadingId === cv.id}
                className="gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(cv.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
