import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogOut, 
  Users, 
  FileText, 
  Settings, 
  Shield, 
  Download, 
  Trash2, 
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Eye,
  UserCog
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Submission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  target_role: string | null;
  job_title: string;
  service_type: string | null;
  status: string | null;
  output_type: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isAdmin, isSuperAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin]);

  const fetchSubmissions = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("user_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions((data as Submission[]) || []);
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

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        s.full_name.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower) ||
        (s.target_role?.toLowerCase().includes(searchLower)) ||
        s.job_title.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = 
        statusFilter === "all" || 
        (s.status || "New") === statusFilter;

      // Service filter
      const matchesService = 
        serviceFilter === "all" || 
        (s.service_type || s.output_type) === serviceFilter;

      // Date filter
      const submissionDate = new Date(s.created_at);
      const matchesDateFrom = !dateFrom || submissionDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || submissionDate <= new Date(dateTo + "T23:59:59");

      return matchesSearch && matchesStatus && matchesService && matchesDateFrom && matchesDateTo;
    });
  }, [submissions, searchTerm, statusFilter, serviceFilter, dateFrom, dateTo]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const downloadCSV = () => {
    if (filteredSubmissions.length === 0) {
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
      "City",
      "LinkedIn URL",
      "Portfolio URL",
      "Target Role",
      "Service Type",
      "Status",
      "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredSubmissions.map((s) =>
        [
          s.id,
          `"${s.full_name}"`,
          s.email,
          s.phone || "",
          s.city || "",
          s.linkedin_url || "",
          s.portfolio_url || "",
          `"${s.target_role || s.job_title}"`,
          s.service_type || s.output_type,
          s.status || "New",
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
      description: `${filteredSubmissions.length} submissions exported to CSV`,
    });
  };

  const deleteSubmission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setServiceFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Stats calculations
  const stats = useMemo(() => {
    const newCount = submissions.filter(s => (s.status || "New") === "New").length;
    const inReviewCount = submissions.filter(s => s.status === "In Review").length;
    const completedCount = submissions.filter(s => s.status === "Completed").length;
    return { total: submissions.length, newCount, inReviewCount, completedCount };
  }, [submissions]);

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
            { icon: Users, label: "Total Submissions", value: stats.total.toString(), color: "text-primary" },
            { icon: FileText, label: "New", value: stats.newCount.toString(), color: "text-blue-500" },
            { icon: Settings, label: "In Review", value: stats.inReviewCount.toString(), color: "text-yellow-500" },
            { icon: Shield, label: "Completed", value: stats.completedCount.toString(), color: "text-green-500" },
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

        {/* Tabbed Content - Show to all admins */}
        {isAdmin && (
          <Tabs defaultValue="submissions" className="space-y-6">
            <TabsList className={`grid w-full max-w-md ${isSuperAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="submissions" className="gap-2">
                <Users className="w-4 h-4" />
                Submissions
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="admins" className="gap-2">
                  <UserCog className="w-4 h-4" />
                  Manage Admins
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="submissions">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-semibold text-foreground">User Submissions</h3>
              <div className="flex flex-wrap gap-2">
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

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="CV Revamp">CV Revamp</SelectItem>
                  <SelectItem value="AI Suggestions">AI Suggestions</SelectItem>
                  <SelectItem value="CV Review">CV Review</SelectItem>
                  <SelectItem value="cv">CV Only</SelectItem>
                  <SelectItem value="coverLetter">Cover Letter</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10"
                  placeholder="From date"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10"
                    placeholder="To date"
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </p>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No submissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">City</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Target Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Service</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => (
                      <tr 
                        key={submission.id} 
                        className="border-b border-border/50 hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                      >
                        <td className="py-3 px-4 text-sm text-foreground font-medium">{submission.full_name}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{submission.email}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">{submission.phone || "-"}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{submission.city || "-"}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{submission.target_role || submission.job_title}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">{submission.service_type || submission.output_type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (submission.status || "New") === "Completed" ? "bg-green-500/10 text-green-500" :
                            submission.status === "In Review" ? "bg-yellow-500/10 text-yellow-500" :
                            "bg-blue-500/10 text-blue-500"
                          }`}>
                            {submission.status || "New"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/submissions/${submission.id}`);
                              }}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isSuperAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => deleteSubmission(submission.id, e)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
              </motion.div>
            </TabsContent>

            {isSuperAdmin && (
              <TabsContent value="admins">
                <AdminUserManagement />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
