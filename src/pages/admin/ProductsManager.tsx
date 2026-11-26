import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ProductSocialAdModal } from "@/components/admin/ProductSocialAdModal";

type ProductRow = {
  id: string;
  business_model: string;
  title: string;
  title_ar: string | null;
  title_en: string | null;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price: number | null;
  supplier_cost: number | null;
  currency: string;
  affiliate_url: string | null;
  supplier_sku: string | null;
  status: string;
  tags: unknown;
  created_at: string;
};

const emptyForm = {
  title: "",
  title_ar: "",
  title_en: "",
  description: "",
  category: "",
  image_url: "",
  price: "",
  supplier_cost: "",
  currency: "USD",
  affiliate_url: "",
  supplier_sku: "",
  business_model: "DROPSHIPPING",
  status: "DRAFT",
  tags: "",
};

const statusVariant = (status: string) =>
  status === "ACTIVE" ? "default" : status === "DRAFT" ? "secondary" : "outline";

export default function ProductsManager() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [adsProduct, setAdsProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_products")
      .select("id,business_model,title,title_ar,title_en,description,category,image_url,price,supplier_cost,currency,affiliate_url,supplier_sku,status,tags,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Could not load products: ${error.message}`);
    } else {
      setProducts((data ?? []) as ProductRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startEdit = (product: ProductRow) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      title_ar: product.title_ar ?? "",
      title_en: product.title_en ?? "",
      description: product.description ?? "",
      category: product.category ?? "",
      image_url: product.image_url ?? "",
      price: product.price != null ? String(product.price) : "",
      supplier_cost: product.supplier_cost != null ? String(product.supplier_cost) : "",
      currency: product.currency || "USD",
      affiliate_url: product.affiliate_url ?? "",
      supplier_sku: product.supplier_sku ?? "",
      business_model: product.business_model,
      status: product.status,
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Product title is required.");
      return;
    }
    if (form.business_model === "AFFILIATE" && !form.affiliate_url.trim()) {
      toast.error("Affiliate products require an affiliate URL.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        title_ar: form.title_ar.trim() || null,
        title_en: form.title_en.trim() || null,
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        image_url: form.image_url.trim() || null,
        price: form.price ? Number(form.price) : null,
        supplier_cost: form.supplier_cost ? Number(form.supplier_cost) : null,
        currency: form.currency || "USD",
        affiliate_url: form.business_model === "AFFILIATE" ? form.affiliate_url.trim() : null,
        supplier_sku: form.supplier_sku.trim() || null,
        business_model: form.business_model,
        status: form.status,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const { error } = editingId
        ? await supabase.from("store_products").update(payload).eq("id", editingId)
        : await supabase.from("store_products").insert(payload);

      if (error) throw error;
      toast.success(editingId ? "Product updated." : "Product created.");
      resetForm();
      await load();
    } catch (err) {
      toast.error(`Save failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (id: string) => {
    if (!window.confirm("Delete this product permanently?")) return;
    const { error } = await supabase.from("store_products").delete().eq("id", id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success("Product deleted.");
    if (editingId === id) resetForm();
    await load();
  };

  const updateField = (field: keyof typeof emptyForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <AdminPageShell>
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Store Products</h1>
      <p className="mb-8 text-muted-foreground">
        Manage the local catalog shown on the storefront. Affiliate products need a real affiliate URL;
        dropshipping products can be purchased through local checkout.
      </p>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-4 w-4 text-primary" />
              {editingId ? "Edit product" : "Add product"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Title (AR)</Label><Input value={form.title_ar} onChange={(e) => updateField("title_ar", e.target.value)} /></div>
                <div><Label>Title (EN)</Label><Input value={form.title_en} onChange={(e) => updateField("title_en", e.target.value)} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => updateField("category", e.target.value)} /></div>
                <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => updateField("image_url", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Price</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} /></div>
                <div><Label>Supplier cost</Label><Input type="number" min="0" step="0.01" value={form.supplier_cost} onChange={(e) => updateField("supplier_cost", e.target.value)} /></div>
                <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => updateField("currency", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Business model</Label>
                  <Select value={form.business_model} onValueChange={(v) => updateField("business_model", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DROPSHIPPING">Dropshipping</SelectItem>
                      <SelectItem value="AFFILIATE">Affiliate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.business_model === "AFFILIATE" && (
                <div><Label>Affiliate URL</Label><Input type="url" value={form.affiliate_url} onChange={(e) => updateField("affiliate_url", e.target.value)} required /></div>
              )}
              <div><Label>Supplier SKU</Label><Input value={form.supplier_sku} onChange={(e) => updateField("supplier_sku", e.target.value)} /></div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="heritage, gift, trending" /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Save changes" : "Create product"}
                </Button>
                {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Catalog ({products.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : products.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No products yet. Add your first product.</p>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 rounded-lg border p-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="h-14 w-14 rounded-md object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{product.title_ar || product.title}</p>
                        <Badge variant={statusVariant(product.status)}>{product.status}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.business_model} · {product.category ?? "uncategorized"} · {product.currency} {Number(product.price ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setAdsProduct(product)}>
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Ads
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(product)} aria-label="Edit product">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => void removeProduct(product.id)} aria-label="Delete product">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    {adsProduct && (
      <ProductSocialAdModal
        product={{
          id: adsProduct.id,
          title: adsProduct.title_ar || adsProduct.title,
          price: Number(adsProduct.price ?? 0),
          description: adsProduct.description,
          category: adsProduct.category,
        }}
        open
        onClose={() => setAdsProduct(null)}
      />
    )}
    </AdminPageShell>
  );
}
