import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export const GlobalFreeModeSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [banner, setBanner] = useState("Company anniversary: unlimited free CV revamps today 🎉");

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("app_settings")
      .select("free_mode_enabled, free_mode_banner")
      .eq("id", "global")
      .maybeSingle();

    if (error) {
      toast({ title: "Error", description: "Unable to load global settings.", variant: "destructive" });
    } else {
      setEnabled(Boolean(data?.free_mode_enabled));
      setBanner(data?.free_mode_banner || "Company anniversary: unlimited free CV revamps today 🎉");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("app_settings")
      .update({
        free_mode_enabled: enabled,
        free_mode_banner: banner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global");

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: enabled ? "Global free mode is now ON." : "Global free mode is now OFF." });
    }
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Global Free Mode</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Turn this on to allow everyone to use CV generation without daily free-plan limits.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-foreground">Free access for all users</p>
              <p className="text-sm text-muted-foreground">Temporarily bypasses daily trial limits.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-banner">Homepage banner message</Label>
            <Input
              id="global-banner"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="Company anniversary: unlimited free CV revamps today 🎉"
            />
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </>
      )}
    </div>
  );
};
