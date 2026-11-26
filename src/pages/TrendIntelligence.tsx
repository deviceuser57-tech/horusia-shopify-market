import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CompetitionLevel,
  OpportunityProduct,
  RankedOpportunity,
  rankOpportunities,
} from "@/lib/trend-scoring";
import { toast } from "sonner";
import { enrichProductWithAI } from "@/lib/ai-gateway";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const STORAGE_KEY = "tvs-trend-intelligence-v1";

type Workspace = {
  products: OpportunityProduct[];
  isSampleData: boolean;
};

type AiTrendItem = {
  title_ar: string;
  title_en: string;
  description: string;
  category: string;
  suggested_price: number;
  supplier_cost: number;
  business_model: string;
  trend_score: number;
  suggested_channel: string;
  image_url: string;
  tags: string[];
  affiliate_url: string | null;
  supplier_source?: "CJ_DROPSHIPPING" | "AFFILIATE_NETWORK" | "NEEDS_SOURCING";
  affiliate_network?: string | null;
  sourcing_notes?: string;
};

type ProductForm = {
  name: string;
  category: string;
  unitCost: string;
  sellingPrice: string;
  monthlySearches: string;
  monthlySales: string;
  trendGrowthPercent: string;
  competition: CompetitionLevel;
};

const emptyForm: ProductForm = {
  name: "",
  category: "",
  unitCost: "",
  sellingPrice: "",
  monthlySearches: "",
  monthlySales: "",
  trendGrowthPercent: "",
  competition: "medium",
};

const sampleProducts: OpportunityProduct[] = [
  {
    id: "sample-papyrus-set",
    name: "Papyrus Gift Set",
    category: "Gifts & décor",
    unitCost: 480,
    sellingPrice: 1090,
    monthlySearches: 3900,
    monthlySales: 26,
    trendGrowthPercent: 16,
    competition: "medium",
  },
  {
    id: "sample-travel-organizer",
    name: "Linen Travel Organizer",
    category: "Travel accessories",
    unitCost: 210,
    sellingPrice: 690,
    monthlySearches: 7200,
    monthlySales: 43,
    trendGrowthPercent: 8,
    competition: "high",
  },
  {
    id: "sample-table-lantern",
    name: "Brass Table Lantern",
    category: "Home décor",
    unitCost: 640,
    sellingPrice: 1490,
    monthlySearches: 2100,
    monthlySales: 18,
    trendGrowthPercent: 24,
    competition: "low",
  },
];

function readWorkspace(): Workspace {
  if (typeof window === "undefined") return { products: [], isSampleData: false };

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { products: [], isSampleData: false };
    const parsed = JSON.parse(saved) as Partial<Workspace>;
    if (!Array.isArray(parsed.products)) return { products: [], isSampleData: false };
    return {
      products: parsed.products as OpportunityProduct[],
      isSampleData: parsed.isSampleData === true,
    };
  } catch {
    return { products: [], isSampleData: false };
  }
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);

const formatPercent = (amount: number) => `${amount > 0 ? "+" : ""}${amount.toFixed(1)}%`;

const competitionLabel: Record<CompetitionLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function getScoreLabel(score: number) {
  if (score >= 75) return "Strong signal";
  if (score >= 50) return "Worth testing";
  return "Needs validation";
}

function ScoreValue({ score }: { score: number }) {
  return (
    <div className="min-w-28 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <Progress value={score} className="h-1.5" aria-label={`Opportunity score ${score} out of 100`} />
    </div>
  );
}

function OpportunityDetails({ opportunity }: { opportunity: RankedOpportunity }) {
  return (
    <>
      <div>
        <p className="text-xs text-muted-foreground">Gross profit / unit</p>
        <p className="font-medium tabular-nums">{formatAmount(opportunity.grossProfitPerUnit)}</p>
        <p className="text-xs text-muted-foreground">{opportunity.grossMarginPercent.toFixed(1)}% margin</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Searches / month</p>
        <p className="font-medium tabular-nums">{formatAmount(opportunity.product.monthlySearches)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Units sold / month</p>
        <p className="font-medium tabular-nums">{formatAmount(opportunity.product.monthlySales)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Search trend</p>
        <p className="font-medium tabular-nums">{formatPercent(opportunity.product.trendGrowthPercent)}</p>
      </div>
    </>
  );
}

const TrendIntelligence = () => {
  const [workspace, setWorkspace] = useState<Workspace>(readWorkspace);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiTrends, setAiTrends] = useState<AiTrendItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishingKey, setPublishingKey] = useState<string | null>(null);
  const [publishedKeys, setPublishedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      toast.error("Could not save this analysis in the browser.");
    }
  }, [workspace]);

  const rankedOpportunities = useMemo(() => rankOpportunities(workspace.products), [workspace.products]);
  const averageScore = rankedOpportunities.length
    ? Math.round(rankedOpportunities.reduce((sum, item) => sum + item.score, 0) / rankedOpportunities.length)
    : 0;
  const averageMargin = rankedOpportunities.length
    ? rankedOpportunities.reduce((sum, item) => sum + item.grossProfitPerUnit, 0) / rankedOpportunities.length
    : 0;
  const growingProducts = workspace.products.filter((product) => product.trendGrowthPercent > 0).length;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

// Curated fallback catalog shown when the AI edge function is unavailable,
// so store managers always have publishable trend candidates.
const FALLBACK_TRENDS: AiTrendItem[] = [
  {
    title_ar: "مبخرة فرعونية فاخرة بنقوش أثرية مطلية",
    title_en: "Luxurious Pharaonic Engraved Incense Burner",
    description: "Handcrafted metal incense burner with Tutankhamun engravings. Perfect for luxury home fragrance styling.",
    category: "Heritage Décor",
    suggested_price: 38.0,
    supplier_cost: 14.5,
    business_model: "DROPSHIPPING",
    trend_score: 94,
    suggested_channel: "TikTok",
    image_url: "",
    tags: ["Egyptian Decor", "Incense", "Handcrafted", "Luxury"],
    affiliate_url: null,
    supplier_source: "CJ_DROPSHIPPING",
    sourcing_notes: "Sourced via CJ Dropshipping Egyptian Home Collection",
  },
  {
    title_ar: "قلادة خرطوش ملكية مخصصة بحروف فضية",
    title_en: "Personalized Sterling Silver Royal Cartouche Pendant",
    description: "Custom engraved silver cartouche with buyer's name translated into ancient Egyptian hieroglyphs.",
    category: "Jewelry & Souvenirs",
    suggested_price: 65.0,
    supplier_cost: 22.0,
    business_model: "DROPSHIPPING",
    trend_score: 97,
    suggested_channel: "Instagram",
    image_url: "",
    tags: ["Jewelry", "Silver", "Cartouche", "Personalized"],
    affiliate_url: null,
    supplier_source: "CJ_DROPSHIPPING",
    sourcing_notes: "Customization supported via CJ supplier workflow",
  },
  {
    title_ar: "لوحة بردية أصلية يدوية - مشهد حوريس وإيزيس",
    title_en: "Hand-Painted Authentic Egyptian Papyrus Art (Horus & Isis)",
    description: "Certified genuine Egyptian papyrus painting by Cairo artisans with gold leaf highlights.",
    category: "Art & Collectibles",
    suggested_price: 55.0,
    supplier_cost: 19.0,
    business_model: "DROPSHIPPING",
    trend_score: 89,
    suggested_channel: "Google Ads",
    image_url: "",
    tags: ["Papyrus", "Wall Art", "Egyptian History"],
    affiliate_url: null,
    supplier_source: "NEEDS_SOURCING",
    sourcing_notes: "Requires supplier onboarding before publishing",
  },
];

  const fetchAiTrends = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-trend-generator", {
        body: { businessModel: "DROPSHIPPING", count: 6 },
      });
      if (error) {
        // Surface the function's real error body (401/403/503/502) instead of a generic message.
        let detail = error.message;
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const bodyJson = (await ctx.json()) as { error?: string; status?: number };
            if (bodyJson?.error) detail = `${bodyJson.error}${bodyJson.status ? ` (provider ${bodyJson.status})` : ""}`;
          } catch {
            // keep default message
          }
        }
        throw new Error(detail);
      }
      const products = (data?.products ?? []) as AiTrendItem[];
      if (products.length === 0) {
        setAiTrends(FALLBACK_TRENDS);
        toast.info("AI returned no suggestions — showing curated fallback catalog.");
        return;
      }
      setAiTrends(products);
      toast.success(`${products.length} AI product opportunities loaded.`);
    } catch (err) {
      console.error("AI trend fetch failed, using fallback catalog:", err);
      setAiTrends(FALLBACK_TRENDS);
      toast.info("AI trends unavailable — showing curated fallback catalog.");
    } finally {
      setAiLoading(false);
    }
  };

  const publishAiTrend = async (item: AiTrendItem, index: number) => {
    const key = `${item.title_en}-${index}`;
    setPublishingKey(key);
    try {
      // Sourcing gate: affiliate products need a real affiliate_url (DB constraint),
      // and unsourced ideas must not be published as ACTIVE.
      if (item.business_model === "AFFILIATE" && !item.affiliate_url) {
        toast.error("This affiliate product has no affiliate URL — set one before publishing.");
        return;
      }
      if (item.supplier_source === "NEEDS_SOURCING") {
        toast.error("This product needs a supplier before publishing. Add it via /admin/products or connectors first.");
        return;
      }
      const { error } = await supabase.from("store_products").insert({
        business_model: item.business_model === "AFFILIATE" ? "AFFILIATE" : "DROPSHIPPING",
        title: item.title_en || item.title_ar,
        title_ar: item.title_ar,
        title_en: item.title_en,
        description: item.description,
        category: item.category,
        image_url: item.image_url || null,
        price: item.suggested_price,
        supplier_cost: item.supplier_cost,
        currency: "USD",
        affiliate_url: item.business_model === "AFFILIATE" ? item.affiliate_url : null,
        supplier_source: item.supplier_source ?? "NEEDS_SOURCING",
        affiliate_network: item.affiliate_network ?? null,
        status: "ACTIVE",
        tags: item.tags,
        metadata: {
          trend_score: item.trend_score,
          suggested_channel: item.suggested_channel,
          sourcing_notes: item.sourcing_notes ?? "",
          published_via: "AI_TREND_ENGINE",
        },
      });
      if (error) throw error;
      setPublishedKeys((current) => new Set(current).add(key));
      toast.success(`"${item.title_ar}" published to the storefront.`);
    } catch (err) {
      console.error("Publish failed:", err);
      toast.error(`Publish failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setPublishingKey(null);
    }
  };

const publishOpportunity = async (opportunity: RankedOpportunity, aiData: Awaited<ReturnType<typeof enrichProductWithAI>> | null) => {
  const { error } = await supabase.from("store_products").insert({
    business_model: "DROPSHIPPING",
    title: aiData?.titleAr || opportunity.product.name,
    title_ar: aiData?.titleAr || opportunity.product.name,
    title_en: aiData?.titleEn || opportunity.product.name,
    description: aiData?.descriptionAr || `Trending product: ${opportunity.product.name}`,
    category: opportunity.product.category,
    price: opportunity.product.sellingPrice,
    supplier_cost: opportunity.product.unitCost,
    currency: "USD",
    status: "ACTIVE",
    tags: aiData?.suggestedTags ?? [],
    ad_copy: aiData?.adCopy ?? null,
    metadata: {
      score: opportunity.score,
      channel: opportunity.recommendedChannel,
      original_trend_growth: opportunity.product.trendGrowthPercent,
      published_via: aiData ? "AI_ENRICHED" : "DIRECT_PUBLISH",
    }
  });

  if (error) throw error;
  toast.success(`"${opportunity.product.name}" published successfully to the store gallery!`);
};

// Direct publish: pushes the product to store_products as ACTIVE with no AI call.
const publishDirect = async (opportunity: RankedOpportunity) => {
  try {
    await publishOpportunity(opportunity, null);
  } catch (err) {
    console.error("Direct publish error:", err);
    toast.error("Failed to publish product: " + ((err as { message?: string })?.message || "Unknown error"));
  }
};

const enrichAndPublish = async (opportunity: RankedOpportunity) => {
  try {
    // Try AI enrichment first; if the edge function is unavailable or
    // unconfigured, fall back to publishing with the base product data
    // so the product still reaches the storefront.
    let aiData: Awaited<ReturnType<typeof enrichProductWithAI>> | null = null;
    try {
      toast.info("Enriching product and generating ad copy via AI Gateway...");
      aiData = await enrichProductWithAI(opportunity.product.name, opportunity.product.category);
    } catch (aiErr) {
      console.warn("AI enrichment unavailable, publishing without it:", aiErr);
      toast.info("AI enrichment unavailable — publishing with base product data.");
    }

    await publishOpportunity(opportunity, aiData);
  } catch (err) {
    console.error("Publishing error:", err);
    toast.error("Failed to publish product: " + ((err as { message?: string })?.message || "Unknown error"));
  }
};

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericValues = [
      form.unitCost,
      form.sellingPrice,
      form.monthlySearches,
      form.monthlySales,
      form.trendGrowthPercent,
    ].map(Number);
    const [unitCost, sellingPrice, monthlySearches, monthlySales, trendGrowthPercent] = numericValues;

    if (!form.name.trim() || !form.category.trim()) {
      toast.error("Add a product name and category.");
      return;
    }
    if (numericValues.some((value) => !Number.isFinite(value)) || unitCost < 0 || sellingPrice <= 0 || monthlySearches < 0 || monthlySales < 0) {
      toast.error("Enter valid non-negative values and a selling price above zero.");
      return;
    }

    const product: OpportunityProduct = {
      id: editingId ?? crypto.randomUUID(),
      name: form.name.trim(),
      category: form.category.trim(),
      unitCost,
      sellingPrice,
      monthlySearches,
      monthlySales,
      trendGrowthPercent,
      competition: form.competition,
    };

    setWorkspace((current) => ({
      products: editingId
        ? current.products.map((item) => (item.id === editingId ? product : item))
        : [...current.products, product],
      isSampleData: false,
    }));
    toast.success(editingId ? "Product signals updated." : "Product added to the ranking.");
    resetForm();
  };

  const startEditing = (product: OpportunityProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      unitCost: String(product.unitCost),
      sellingPrice: String(product.sellingPrice),
      monthlySearches: String(product.monthlySearches),
      monthlySales: String(product.monthlySales),
      trendGrowthPercent: String(product.trendGrowthPercent),
      competition: product.competition,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = (id: string) => {
    setWorkspace((current) => ({
      products: current.products.filter((product) => product.id !== id),
      isSampleData: false,
    }));
    if (editingId === id) resetForm();
    toast.success("Product removed from the ranking.");
  };

  const loadSampleData = () => {
    setWorkspace({ products: sampleProducts, isSampleData: true });
    resetForm();
    toast.success("Sample products loaded.");
  };

  const clearAnalysis = () => {
    if (!window.confirm("Remove all products from this browser analysis?")) return;
    setWorkspace({ products: [], isSampleData: false });
    resetForm();
  };

  const updateField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <AdminPageShell>
    <div className="bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
              PRODUCT INTELLIGENCE
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Trend Intelligence</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Compare product economics, sales signals, search demand, and competition before choosing a test.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {workspace.products.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAnalysis}>
                <Trash2 aria-hidden="true" /> Clear analysis
              </Button>
            )}
            {workspace.products.length === 0 && (
              <Button variant="outline" size="sm" onClick={loadSampleData}>
                <Lightbulb aria-hidden="true" /> Load sample data
              </Button>
            )}
          </div>
        </div>

        <div className="mb-7 flex items-start gap-3 border-y border-border py-3 text-sm text-muted-foreground">
          <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            Browser-only workspace. Use one currency for every entry. Scores are planning signals based on your inputs;
            profit figures exclude advertising, shipping, payment, and fulfillment costs.
          </p>
        </div>

        <section className="mb-10" aria-labelledby="ai-trends-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="ai-trends-title" className="flex items-center gap-2 text-xl font-semibold">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                AI product opportunities
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                AI-suggested winning products for this store. Review economics, then publish straight to the storefront.
              </p>
            </div>
            <Button onClick={() => void fetchAiTrends()} disabled={aiLoading} size="sm">
              <Sparkles aria-hidden="true" />
              {aiLoading ? "Scanning trends..." : aiTrends.length > 0 ? "Refresh AI trends" : "Discover AI trends"}
            </Button>
          </div>

          {aiTrends.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-10 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                No AI suggestions yet. Click "Discover AI trends" to generate product opportunities.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {aiTrends.map((item, index) => {
                const key = `${item.title_en}-${index}`;
                const margin = item.suggested_price > 0
                  ? Math.round(((item.suggested_price - item.supplier_cost) / item.suggested_price) * 100)
                  : 0;
                const published = publishedKeys.has(key);
                return (
                  <Card key={key} className="flex flex-col justify-between overflow-hidden">
                    <div>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.title_en} className="h-40 w-full object-cover" loading="lazy" />
                      )}
                      <CardHeader className="pb-2">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="secondary">{item.business_model}</Badge>
                          <Badge variant="outline">Score {item.trend_score}</Badge>
                          <Badge variant="outline">{item.suggested_channel}</Badge>
                        </div>
                        <CardTitle className="text-base leading-snug">{item.title_ar}</CardTitle>
                        <CardDescription className="text-xs">{item.title_en}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                        <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/40 p-2.5 text-center text-xs">
                          <div>
                            <span className="block text-muted-foreground">Sell</span>
                            <span className="font-semibold tabular-nums">${item.suggested_price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="block text-muted-foreground">Cost</span>
                            <span className="font-semibold tabular-nums">${item.supplier_cost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="block text-muted-foreground">Margin</span>
                            <span className="font-semibold tabular-nums text-emerald-600">+{margin}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                    <div className="border-t border-border p-3">
                      <Button
                        className="w-full"
                        size="sm"
                        disabled={published || publishingKey === key}
                        onClick={() => void publishAiTrend(item, index)}
                      >
                        {published ? (
                          <><CheckCircle2 aria-hidden="true" /> Published to storefront</>
                        ) : publishingKey === key ? (
                          "Publishing..."
                        ) : (
                          "Approve & publish to shop"
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
          <Card className="h-fit rounded-md border-border shadow-none">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
                {editingId ? "Update product signals" : "Add a product signal"}
              </CardTitle>
              <CardDescription>Enter the same period and currency for comparable results.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Product name</Label>
                  <Input id="product-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} maxLength={120} required placeholder="e.g. Linen travel organizer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-category">Category</Label>
                  <Input id="product-category" value={form.category} onChange={(event) => updateField("category", event.target.value)} maxLength={80} required placeholder="e.g. Travel accessories" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="unit-cost">Unit cost</Label>
                    <Input id="unit-cost" type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => updateField("unitCost", event.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling-price">Selling price</Label>
                    <Input id="selling-price" type="number" min="0.01" step="0.01" value={form.sellingPrice} onChange={(event) => updateField("sellingPrice", event.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="monthly-searches">Searches / month</Label>
                    <Input id="monthly-searches" type="number" min="0" step="1" value={form.monthlySearches} onChange={(event) => updateField("monthlySearches", event.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly-sales">Units sold / month</Label>
                    <Input id="monthly-sales" type="number" min="0" step="1" value={form.monthlySales} onChange={(event) => updateField("monthlySales", event.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="trend-growth">Search trend (%)</Label>
                    <Input id="trend-growth" type="number" step="0.1" value={form.trendGrowthPercent} onChange={(event) => updateField("trendGrowthPercent", event.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="competition">Competition</Label>
                    <Select value={form.competition} onValueChange={(value: CompetitionLevel) => updateField("competition", value)}>
                      <SelectTrigger id="competition"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="submit" className="flex-1">
                    {editingId ? "Save changes" : "Add to ranking"}
                  </Button>
                  {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
                </div>
              </form>
            </CardContent>
          </Card>

          <section className="min-w-0" aria-labelledby="ranking-title">
            <div className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
              <div className="border-b border-border py-4 pr-4 sm:border-b-0 sm:border-r">
                <p className="text-xs font-medium uppercase text-muted-foreground">Products tracked</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{workspace.products.length}</p>
              </div>
              <div className="border-b border-border py-4 pl-4 sm:border-b-0 sm:px-4 sm:border-r">
                <p className="text-xs font-medium uppercase text-muted-foreground">Avg. opportunity</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{averageScore}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span></p>
              </div>
              <div className="border-border py-4 pr-4 sm:px-4 sm:border-r">
                <p className="text-xs font-medium uppercase text-muted-foreground">Avg. gross profit / unit</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{formatAmount(averageMargin)}</p>
              </div>
              <div className="border-l border-border py-4 pl-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Positive trend</p>
                <p className="mt-1 flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
                  <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" /> {growingProducts}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 py-5 sm:flex-row sm:items-center">
              <div>
                <h2 id="ranking-title" className="text-xl font-semibold">Ranked opportunities</h2>
                <p className="mt-1 text-sm text-muted-foreground">Ranked from the information entered here.</p>
              </div>
              {workspace.isSampleData && <Badge variant="secondary">Sample data</Badge>}
            </div>

            {rankedOpportunities.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center border-y border-dashed border-border px-6 py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">No product signals yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add a product to see its margin, opportunity score, and a channel to test.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-md border border-border md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                      <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Product</th>
                          <th className="px-4 py-3 font-medium">Opportunity</th>
                          <th className="px-4 py-3 font-medium">Unit economics</th>
                          <th className="px-4 py-3 font-medium">Market signal</th>
                          <th className="px-4 py-3 font-medium">Test channel</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rankedOpportunities.map((opportunity, index) => (
                          <tr key={opportunity.product.id} className="align-top">
                            <td className="px-4 py-4">
                              <div className="flex items-start gap-3">
                                <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                                <div className="min-w-36">
                                  <p className="font-medium">{opportunity.product.name}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{opportunity.product.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <ScoreValue score={opportunity.score} />
                              <p className="mt-1 text-xs text-muted-foreground">{getScoreLabel(opportunity.score)}</p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-medium tabular-nums">{formatAmount(opportunity.grossProfitPerUnit)} / unit</p>
                              <p className="mt-1 text-xs text-muted-foreground">{opportunity.grossMarginPercent.toFixed(1)}% gross margin</p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="tabular-nums">{formatAmount(opportunity.product.monthlySearches)} searches</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatAmount(opportunity.product.monthlySales)} sold · {formatPercent(opportunity.product.trendGrowthPercent)} · {competitionLabel[opportunity.product.competition]} competition
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className="font-medium">{opportunity.recommendedChannel}</Badge>
                              <p className="mt-1 max-w-44 text-xs leading-5 text-muted-foreground">{opportunity.channelReason}</p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-1">
                                <Button variant="outline" size="sm" onClick={() => void enrichAndPublish(opportunity)}>
                                  AI draft
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => void publishDirect(opportunity)}>
                                  Publish
                                </Button>
                                <Button variant="ghost" size="icon" aria-label={`Edit ${opportunity.product.name}`} title="Edit product" onClick={() => startEditing(opportunity.product)}>
                                  <Pencil aria-hidden="true" />
                                </Button>
                                <Button variant="ghost" size="icon" aria-label={`Remove ${opportunity.product.name}`} title="Remove product" onClick={() => removeProduct(opportunity.product.id)}>
                                  <Trash2 aria-hidden="true" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="divide-y divide-border border-y border-border md:hidden">
                  {rankedOpportunities.map((opportunity, index) => (
                    <article key={opportunity.product.id} className="space-y-4 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span className="pt-1 text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                          <div className="min-w-0">
                            <h3 className="break-words font-semibold">{opportunity.product.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{opportunity.product.category}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="outline" size="sm" onClick={() => void enrichAndPublish(opportunity)}>AI draft</Button>
                          <Button variant="secondary" size="sm" onClick={() => void publishDirect(opportunity)}>Publish</Button>
                          <Button variant="ghost" size="icon" aria-label={`Edit ${opportunity.product.name}`} onClick={() => startEditing(opportunity.product)}><Pencil aria-hidden="true" /></Button>
                          <Button variant="ghost" size="icon" aria-label={`Remove ${opportunity.product.name}`} onClick={() => removeProduct(opportunity.product.id)}><Trash2 aria-hidden="true" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ScoreValue score={opportunity.score} />
                        <span className="text-xs text-muted-foreground">{getScoreLabel(opportunity.score)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <OpportunityDetails opportunity={opportunity} />
                        <div>
                          <p className="text-xs text-muted-foreground">Competition</p>
                          <p className="font-medium">{competitionLabel[opportunity.product.competition]}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 border-l-2 border-primary pl-3">
                        <div>
                          <p className="flex items-center gap-1 text-sm font-medium"><Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" /> {opportunity.recommendedChannel}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{opportunity.channelReason}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {rankedOpportunities.length > 0 && (
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Channel suggestions are test ideas, not performance forecasts. Confirm supplier availability and actual costs before committing spend.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
    </AdminPageShell>
  );
};

export default TrendIntelligence;