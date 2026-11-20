import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  Lightbulb,
  Pencil,
  Plus,
  Search,
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

const STORAGE_KEY = "tvs-trend-intelligence-v1";

type Workspace = {
  products: OpportunityProduct[];
  isSampleData: boolean;
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Back to store">
              <Link to="/"><ArrowLeft aria-hidden="true" /></Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Tumāninah Veritas</p>
              <p className="text-xs text-muted-foreground">Store operations</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/shop">View storefront <ArrowUpRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </header>

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
  );
};

export default TrendIntelligence;