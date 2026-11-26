import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type CjProduct = {
  pid: string;
  productNameEn?: string;
  productName?: string;
  sellPrice?: number | string;
  productImage?: string;
};

type SupplierOrderRow = {
  id: string;
  status: string;
  external_order_id: string | null;
  created_at: string;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function DropshipOpsPortal() {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CjProduct[]>([]);
  const [retailPrices, setRetailPrices] = useState<Record<string, string>>({});
  const [importingId, setImportingId] = useState<string | null>(null);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrderRow[]>([]);

  // Margin calculator
  const [retail, setRetail] = useState("");
  const [cost, setCost] = useState("");
  const [freight, setFreight] = useState("0");

  const retailN = num(retail);
  const costN = num(cost);
  const freightN = num(freight);
  const profit = retailN - costN - freightN;
  const marginPct = retailN > 0 ? (profit / retailN) * 100 : 0;

  const loadSupplierOrders = async () => {
    const { data } = await supabase
      .from("supplier_orders")
      .select("id,status,external_order_id,created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    setSupplierOrders((data ?? []) as SupplierOrderRow[]);
  };

  useEffect(() => { void loadSupplierOrders(); }, []);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("cj-connector", {
        body: { action: "SEARCH_PRODUCTS", keyword: keyword.trim() },
      });
      if (error) throw error;
      const list = data?.data?.list ?? data?.data ?? [];
      const items = (Array.isArray(list) ? list : []) as CjProduct[];
      setResults(items);
      if (!items.length) toast.info("No CJ products matched that keyword.");
    } catch (err) {
      toast.error(`CJ search failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setSearching(false);
    }
  };

  const importProduct = async (item: CjProduct) => {
    const retailPrice = num(retailPrices[item.pid]) || num(item.sellPrice);
    if (!retailPrice) {
      toast.error("Enter a retail price before importing.");
      return;
    }
    setImportingId(item.pid);
    try {
      const supplierCost = num(item.sellPrice);
      const { error } = await supabase.from("store_products").insert({
        title: item.productNameEn ?? item.productName ?? `CJ Product ${item.pid}`,
        title_en: item.productNameEn ?? null,
        description: null,
        category: "Dropshipping",
        image_url: item.productImage ?? null,
        price: retailPrice,
        supplier_cost: supplierCost || null,
        currency: "USD",
        business_model: "DROPSHIPPING",
        status: "DRAFT",
        supplier_sku: item.pid,
        supplier_source: "CJ_DROPSHIPPING",
        metadata: { imported_from: "cj-connector", cj_pid: item.pid },
      });
      if (error) throw error;
      toast.success(`Imported "${item.productNameEn ?? item.pid}" as draft — enrich it in Products.`);
    } catch (err) {
      toast.error(`Import failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <AdminPageShell>
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Dropshipping Ops</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Source products from CJ Dropshipping, calculate margins, and import winners into the catalog.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CJ catalog search */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />CJ Dropshipping catalog</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={search} className="mb-4 flex gap-2">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search CJ catalog (e.g. incense burner, silver jewelry)" />
              <Button type="submit" disabled={searching} className="gap-2">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </form>
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Search the CJ catalog to find products to sell.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {results.map((item) => {
                  const cjPrice = num(item.sellPrice);
                  const retailPrice = num(retailPrices[item.pid]) || cjPrice;
                  const estProfit = retailPrice - cjPrice;
                  const estMargin = retailPrice > 0 ? (estProfit / retailPrice) * 100 : 0;
                  return (
                    <div key={item.pid} className="flex gap-3 rounded-lg border p-3">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productNameEn ?? "CJ product"} className="h-16 w-16 shrink-0 rounded-md object-cover" />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-md bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.productNameEn ?? item.productName ?? item.pid}</p>
                        <p className="text-xs text-muted-foreground">
                          CJ price: ${cjPrice.toFixed(2)}
                          {retailPrice > 0 && ` · Est. profit: $${estProfit.toFixed(2)} (${estMargin.toFixed(0)}%)`}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 w-28 text-xs"
                            placeholder={`Retail $${cjPrice.toFixed(0)}`}
                            value={retailPrices[item.pid] ?? ""}
                            onChange={(e) => setRetailPrices((c) => ({ ...c, [item.pid]: e.target.value }))}
                          />
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => void importProduct(item)} disabled={importingId === item.pid}>
                            {importingId === item.pid ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackagePlus className="h-3 w-3" />}
                            Import
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Margin calculator */}
        <Card>
          <CardHeader><CardTitle>Margin calculator</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Retail price (USD)</Label><Input type="number" min="0" step="0.01" value={retail} onChange={(e) => setRetail(e.target.value)} /></div>
            <div><Label>Supplier cost (USD)</Label><Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
            <div><Label>Estimated freight (USD)</Label><Input type="number" min="0" step="0.01" value={freight} onChange={(e) => setFreight(e.target.value)} /></div>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between"><span>Profit per unit</span><span className="font-semibold">${profit.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Margin</span><span className={`font-semibold ${marginPct >= 30 ? "text-emerald-600" : marginPct >= 15 ? "text-amber-600" : "text-destructive"}`}>{marginPct.toFixed(1)}%</span></div>
            </div>
            <p className="text-xs text-muted-foreground">Rule of thumb: aim for ≥30% margin after freight and payment fees (~3%).</p>
          </CardContent>
        </Card>

        {/* Supplier orders */}
        <Card>
          <CardHeader><CardTitle>Supplier orders ({supplierOrders.length})</CardTitle></CardHeader>
          <CardContent>
            {supplierOrders.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No supplier orders submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {supplierOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span className="font-mono text-xs">{o.external_order_id ?? o.id.slice(0, 8)}</span>
                    <Badge variant={o.status === "ACCEPTED" ? "default" : o.status === "FAILED" ? "destructive" : "secondary"}>{o.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminPageShell>
  );
}
