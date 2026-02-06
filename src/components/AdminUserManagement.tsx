import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Shield, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AppRole = "super_admin" | "admin" | "user";

interface AdminUser {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

export const AdminUserManagement = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("admin");

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch user_roles with admin or super_admin roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("role", ["admin", "super_admin"]);

      if (rolesError) throw rolesError;

      // Fetch profiles to get emails
      const userIds = roles?.map(r => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Merge roles with emails
        const adminUsersWithEmails = roles?.map(role => ({
          ...role,
          email: profiles?.find(p => p.user_id === role.user_id)?.email || "Unknown"
        })) || [];

        setAdminUsers(adminUsersWithEmails);
      } else {
        setAdminUsers([]);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAdminUser = async () => {
    if (!newEmail || !newPassword) {
      toast({
        title: "Missing fields",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create user using Supabase auth signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          emailRedirectTo: window.location.origin + "/admin/login",
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Insert the role for the new user
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: newRole,
        });

      if (roleError) throw roleError;

      toast({
        title: "Admin created",
        description: `${newEmail} has been added as ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'}. They will receive a confirmation email.`,
      });

      // Reset form and close dialog
      setNewEmail("");
      setNewPassword("");
      setNewRole("admin");
      setIsDialogOpen(false);
      
      // Refresh the list
      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const removeAdminRole = async (roleId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      setAdminUsers(prev => prev.filter(u => u.id !== roleId));
      toast({
        title: "Removed",
        description: `${userEmail} admin access has been revoked`,
      });
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin access",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Users
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin access for CSV exports and dashboard
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary">
              <UserPlus className="w-4 h-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin account with access to the dashboard and CSV exports.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(value: AppRole) => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (CSV Access)</SelectItem>
                    <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full gradient-primary" 
                onClick={createAdminUser}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Admin User
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : adminUsers.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No admin users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {adminUsers.map((adminUser) => (
            <div
              key={adminUser.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  adminUser.role === "super_admin" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-blue-500/10 text-blue-500"
                }`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{adminUser.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {adminUser.role === "super_admin" ? "Super Admin" : "Admin"} • Added {new Date(adminUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will revoke admin access for {adminUser.email}. They will no longer be able to access the dashboard or download CSV exports.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeAdminRole(adminUser.id, adminUser.email || "")}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove Access
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
