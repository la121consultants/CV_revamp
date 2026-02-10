import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Crown, Mail, Loader2, Search, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface UnlimitedGrant {
  id: string;
  user_email: string;
  granted_by: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export const UnlimitedAccessManagement = () => {
  const [grants, setGrants] = useState<UnlimitedGrant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-unlimited-access", {
        body: { action: "list" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGrants(data?.grants || []);
    } catch (err: any) {
      console.error("Error fetching grants:", err);
      toast({ title: "Error", description: err.message || "Failed to load grants", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!newEmail) {
      toast({ title: "Missing email", description: "Please enter the user's email address.", variant: "destructive" });
      return;
    }
    setIsGranting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-unlimited-access", {
        body: { action: "grant", email: newEmail, notes: newNotes || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Access granted", description: `${newEmail} now has unlimited CV access.` });
      setNewEmail("");
      setNewNotes("");
      setIsDialogOpen(false);
      fetchGrants();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to grant access", variant: "destructive" });
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevoke = async (grantId: string, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-unlimited-access", {
        body: { action: "revoke", grant_id: grantId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGrants((prev) => prev.filter((g) => g.id !== grantId));
      toast({ title: "Access revoked", description: `Unlimited access removed for ${email}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to revoke access", variant: "destructive" });
    }
  };

  const filtered = grants.filter(
    (g) =>
      !searchTerm ||
      g.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Unlimited CV Access
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Grant or revoke unlimited CV revamp access for specific users
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Unlimited CV Access</DialogTitle>
              <DialogDescription>
                This user will be able to generate and download CVs without any usage limits or payment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="grant-email">User Email</Label>
                <Input
                  id="grant-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-notes">Notes (optional)</Label>
                <Input
                  id="grant-notes"
                  placeholder="e.g. VIP client, staff member"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full gradient-primary"
                onClick={handleGrant}
                disabled={isGranting}
              >
                {isGranting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Grant Unlimited Access
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {grants.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <Crown className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {grants.length === 0
              ? "No users have been granted unlimited access yet."
              : "No matching users found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((grant) => (
            <div
              key={grant.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{grant.user_email}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Added {new Date(grant.created_at).toLocaleDateString("en-GB")}</span>
                    {grant.notes && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <StickyNote className="w-3 h-3" />
                          {grant.notes}
                        </span>
                      </>
                    )}
                  </div>
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
                    <AlertDialogTitle>Revoke Unlimited Access?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {grant.user_email} will no longer have unlimited CV access. They'll return to the free tier with usage limits.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRevoke(grant.id, grant.user_email)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Revoke Access
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
