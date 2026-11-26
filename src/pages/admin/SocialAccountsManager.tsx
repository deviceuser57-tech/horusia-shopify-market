import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type SocialAccount = {
  id: string;
  platform: string;
  account_name: string;
  handle: string | null;
  status: string;
  notes: string | null;
};

const PLATFORMS = ["TIKTOK", "INSTAGRAM", "FACEBOOK", "YOUTUBE", "SNAPCHAT", "PINTEREST", "GOOGLE_ADS", "OTHER"];

export default function SocialAccountsManager() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [platform, setPlatform] = useState("TIKTOK");
  const [accountName, setAccountName] = useState("");
  const [handle, setHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("social_accounts")
      .select("id,platform,account_name,handle,status,notes")
      .order("created_at", { ascending: false });
    setAccounts((data ?? []) as SocialAccount[]);
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!accountName.trim()) { toast.error("Account name is required."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("social_accounts").insert({
        platform,
        account_name: accountName.trim(),
        handle: handle.trim() || null,
        notes: notes.trim() || null,
        status: "ACTIVE",
      });
      if (error) throw error;
      toast.success("Social account saved.");
      setAccountName(""); setHandle(""); setNotes("");
      await load();
    } catch (err) {
      toast.error(`Save failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("social_accounts").update({ status }).eq("id", id);
    if (error) { toast.error("Status update failed."); return; }
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this account?")) return;
    const { error } = await supabase.from("social_accounts").delete().eq("id", id);
    if (error) { toast.error("Delete failed."); return; }
    await load();
  };

  return (
    <AdminPageShell>
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-2 text-3xl font-bold">Social Accounts</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Define the social media accounts used for ad publishing and campaign management.
      </p>

      <Card className="mb-8">
        <CardHeader><CardTitle>Link a social account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Account name</Label><Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Tumāninah Main" required /></div>
            <div><Label>Handle / username</Label><Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@tumaninahveritasstore" /></div>
            <div className="md:col-span-2"><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ad account ID, business manager, etc." /></div>
            <Button type="submit" className="md:col-span-2" disabled={saving}>{saving ? "Saving..." : "Save account"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Linked accounts ({accounts.length})</CardTitle></CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No social accounts linked yet.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.account_name}</p>
                      <Badge variant="secondary">{a.platform.replace("_", " ")}</Badge>
                      <Badge variant={a.status === "ACTIVE" ? "default" : a.status === "PAUSED" ? "secondary" : "destructive"}>{a.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.handle ?? "no handle"}{a.notes ? ` · ${a.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status !== "ACTIVE" && <Button variant="outline" size="sm" onClick={() => void setStatus(a.id, "ACTIVE")}>Activate</Button>}
                    {a.status === "ACTIVE" && <Button variant="outline" size="sm" onClick={() => void setStatus(a.id, "PAUSED")}>Pause</Button>}
                    <Button variant="ghost" size="icon" onClick={() => void remove(a.id)} aria-label="Remove account">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminPageShell>
  );
}
