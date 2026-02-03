import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Users, FileText, Settings, Shield, Download, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import type { UserSubmission } from "@/types";

const AdminDashboard = () => {
  const { user, isAdmin, isSuperAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, user, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSubmissions();
    }
  }, [isSuperAdmin]);

  const fetchSubmissions = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("user_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions((data as UserSubmission[]) || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const downloadCSV = () => {
    if (submissions.length === 0) {
      toast({
        title: "No data",
        description: "There are no submissions to download",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Job Title",
      "LinkedIn URL",
      "CV Filename",
      "Output Type",
      "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...submissions.map((s) =>
        [
          s.id,
          `"${s.full_name}"`,
          s.email,
          s.phone || "",
          `"${s.job_title}"`,
          s.linkedin_url || "",
          s.cv_filename || "",
          s.output_type,
          new Date(s.created_at).toLocaleString()
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded",
      description: `${submissions.length} submissions exported to CSV`,
    });
  };

  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Deleted",
        description: "Submission removed successfully",
      });
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
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
              <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.email}
            </span>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back{isSuperAdmin ? ", Super Admin" : ""}!
          </h2>
          <p className="text-muted-foreground">
            Manage your CV tailoring application from here.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Users, label: "Total Submissions", value: submissions.length.toString(), color: "text-primary" },
            { icon: FileText, label: "CVs Processed", value: submissions.length.toString(), color: "text-secondary" },
            { icon: Settings, label: "Active Sessions", value: "1", color: "text-accent" },
            { icon: Shield, label: "Admin Users", value: isSuperAdmin ? "1" : "0", color: "text-primary" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* User Submissions Table - Only for Super Admin */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">User Submissions</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchSubmissions} className="gap-2" disabled={isLoadingData}>
                  <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={downloadCSV} className="gap-2 gradient-primary">
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Job Title</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm text-foreground">{submission.full_name}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{submission.email}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{submission.phone || "-"}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{submission.job_title}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSubmission(submission.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
