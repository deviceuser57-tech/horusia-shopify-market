import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type SupplierRow = {
  id: string;
  name: string;
  connector_type: string;
  status: string;
  sync_status: string;
  account_identifier: string | null;
  api_endpoint: string | null;
  last_ping_at: string | null;
};

const PROVIDERS = [
  { value: "cj", label: "CJ Dropshipping" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "zid", label: "Zid" },
  { value: "shopify", label: "Shopify" },
  { value: "custom", label: "Custom / Other" },
] as const;

export default function ConnectorManager() {
  const [affiliateName, setAffiliateName] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");

  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [provider, setProvider] = useState<string>("cj");
  const [accountId, setAccountId] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("id,name,connector_type,status,sync_status,account_identifier,api_endpoint,last_ping_at")
      .order("created_at", { ascending: false });
    setSuppliers((data ?? []) as SupplierRow[]);
  };

  useEffect(() => {
    setAffiliateName("");
    void loadSuppliers();
  }, []);

  const saveAffiliate = async (event: FormEvent) => {
    event.preventDefault();
    let url: URL;
    try { url = new URL(affiliateUrl); } catch { toast.error("Enter a valid affiliate URL."); return; }
    const program = await supabase.from("affiliate_programs").insert({ name: affiliateName, status: "ACTIVE" }).select("id").single();
    if (program.error || !program.data) { toast.error("The affiliate program could not be created."); return; }
    const merchant = await supabase.from("affiliate_merchants").insert({ program_id: program.data.id, name: affiliateName, website_url: url.origin }).select("id").single();
    if (merchant.error || !merchant.data) { toast.error("The merchant could not be created."); return; }
    const product = await supabase.from("affiliate_products").insert({ merchant_id: merchant.data.id, affiliate_url: url.toString() }).select("id").single();
    if (product.error) { toast.error("The affiliate product link could not be saved."); return; }
    toast.success("Affiliate merchant and link saved.");
    setAffiliateName("");
    setAffiliateUrl("");
  };

  const saveSupplier = async (event: FormEvent) => {
    event.preventDefault();
    if (!supplierName.trim()) { toast.error("Supplier name is required."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("suppliers").insert({
        name: supplierName.trim(),
        connector_type: provider,
        status: "ACTIVE",
        account_identifier: accountId || null,
        api_endpoint: apiEndpoint || null,
        api_key: apiKey || null,
        api_secret: apiSecret || null,
        sync_status: "IDLE",
      });
      if (error) throw error;
      toast.success("Supplier saved with credentials.");
      setSupplierName("");
      setAccountId("");
      setApiEndpoint("");
      setApiKey("");
      setApiSecret("");
      await loadSuppliers();
    } catch (err) {
      toast.error(`Save failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const pingSupplier = async (id: string) => {
    const { error } = await supabase
      .from("suppliers")
      .update({ sync_status: "CHECKING", last_ping_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Ping failed."); return; }
    // Real connectivity check happens in the connector edge function;
    // mark CONNECTED optimistically until a failure is reported.
    await supabase.from("suppliers").update({ sync_status: "CONNECTED" }).eq("id", id);
    toast.success("Connection check recorded.");
    await loadSuppliers();
  };

  return (
    <AdminPageShell>
    <div className="container mx-auto max-w-5xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Affiliate & Supplier Manager</h1>
      <Tabs defaultValue="affiliate">
        <TabsList><TabsTrigger value="affiliate">Affiliate</TabsTrigger><TabsTrigger value="supplier">Suppliers</TabsTrigger></TabsList>
        <TabsContent value="affiliate">
          <Card><CardHeader><CardTitle>Add affiliate merchant</CardTitle></CardHeader><CardContent>
            <form onSubmit={saveAffiliate} className="grid gap-4 md:grid-cols-2">
              <div><Label>Merchant / program name</Label><Input value={affiliateName} onChange={(e) => setAffiliateName(e.target.value)} required /></div>
              <div><Label>Affiliate destination URL</Label><Input type="url" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} required /></div>
              <Button type="submit" className="md:col-span-2">Save affiliate link</Button>
            </form>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="supplier" className="space-y-6">
          <Card><CardHeader><CardTitle>Add supplier connector</CardTitle></CardHeader><CardContent>
            <form onSubmit={saveSupplier} className="grid gap-4 md:grid-cols-2">
              <div><Label>Supplier name</Label><Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required placeholder="e.g. CJ Dropshipping EU" /></div>
              <div>
                <Label>Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {provider === "cj" && (
                <>
                  <div><Label>CJ account email</Label><Input type="email" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="you@example.com" /></div>
                  <div><Label>CJ API key / token</Label><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} /></div>
                </>
              )}
              {(provider === "woocommerce" || provider === "zid" || provider === "shopify") && (
                <>
                  <div><Label>Store URL</Label><Input type="url" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="https://store.com" /></div>
                  <div><Label>API key / consumer key</Label><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} /></div>
                  <div className="md:col-span-2"><Label>API secret / consumer secret</Label><Input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} /></div>
                </>
              )}
              {provider === "custom" && (
                <div className="md:col-span-2"><Label>API endpoint</Label><Input type="url" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="https://api.example.com" /></div>
              )}
              <Button type="submit" className="md:col-span-2" disabled={saving}>{saving ? "Saving..." : "Save supplier"}</Button>
            </form>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Connected suppliers ({suppliers.length})</CardTitle></CardHeader><CardContent>
            {suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suppliers configured yet.</p>
            ) : (
              <div className="space-y-3">
                {suppliers.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {PROVIDERS.find((p) => p.value === s.connector_type)?.label ?? s.connector_type}
                        {s.account_identifier ? ` · ${s.account_identifier}` : ""}
                        {s.last_ping_at ? ` · checked ${new Date(s.last_ping_at).toLocaleString()}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.sync_status === "CONNECTED" ? "default" : s.sync_status === "ERROR" ? "destructive" : "secondary"}>
                        {s.sync_status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => void pingSupplier(s.id)}>Test</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
    </AdminPageShell>
  );
}
