import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export default function ConnectorManager() {
  const [affiliateName, setAffiliateName] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierType, setSupplierType] = useState("woocommerce");

  useEffect(() => {
    setAffiliateName("");
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
    const { error } = await supabase.from("suppliers").insert({ name: supplierName, connector_type: supplierType, status: "ACTIVE" });
    if (error) { toast.error("The supplier could not be saved."); return; }
    toast.success("Supplier record saved.");
    setSupplierName("");
  };

  return (
    <AdminPageShell>
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Affiliate & Supplier Manager</h1>
      <Tabs defaultValue="affiliate">
        <TabsList><TabsTrigger value="affiliate">Affiliate</TabsTrigger><TabsTrigger value="supplier">Supplier</TabsTrigger></TabsList>
        <TabsContent value="affiliate">
          <Card><CardHeader><CardTitle>Add affiliate merchant</CardTitle></CardHeader><CardContent>
            <form onSubmit={saveAffiliate} className="grid gap-4 md:grid-cols-2">
              <div><Label>Merchant / program name</Label><Input value={affiliateName} onChange={(e) => setAffiliateName(e.target.value)} required /></div>
              <div><Label>Affiliate destination URL</Label><Input type="url" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} required /></div>
              <Button type="submit" className="md:col-span-2">Save affiliate link</Button>
            </form>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="supplier">
          <Card><CardHeader><CardTitle>Add supplier record</CardTitle></CardHeader><CardContent>
            <form onSubmit={saveSupplier} className="grid gap-4 md:grid-cols-2">
              <div><Label>Supplier name</Label><Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required /></div>
              <div><Label>Connector type</Label><Input value={supplierType} onChange={(e) => setSupplierType(e.target.value)} required placeholder="woocommerce, cj, zid..." /></div>
              <Button type="submit" className="md:col-span-2">Save supplier</Button>
            </form>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
    </AdminPageShell>
  );
}
