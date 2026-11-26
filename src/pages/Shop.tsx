import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { ShoppingBag, SlidersHorizontal } from "lucide-react";
import { BreadcrumbSchema } from "@/components/StructuredData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { ProductComparisonModal, CompareItem } from "@/components/ProductComparisonModal";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const [sortBy, setSortBy] = useState<string>("featured");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const addLocalItem = useCartStore((state) => state.addLocalItem);
  const [localProducts, setLocalProducts] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    image_url: string | null;
    price: number | null;
    currency: string;
    affiliate_url: string | null;
    business_model: string;
  }>>([]);

  const [shopHeroSlides, setShopHeroSlides] = useState<HeroSlide[]>([]);

  useEffect(() => {
    supabase
      .from("store_products")
      .select("id,title,description,category,image_url,price,currency,affiliate_url,business_model")
      .eq("status", "ACTIVE")
      .then(({ data }) => setLocalProducts(data ?? []));
  }, []);

  useEffect(() => {
    supabase
      .from("hero_banner_configs")
      .select("id,headline_ar,headline_en,subheadline_ar,subheadline_en,image_url,video_url,overlay_opacity,overlay_color,placement,height_preset,text_align,cta_text_ar,cta_text_en,cta_link,secondary_cta_text_ar,secondary_cta_link,badge_text,sort_order,product_overlay_url,has_animation,headline_color,body_color,style")
      .eq("is_active", true)
      .in("placement", ["shop", "both"])
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setShopHeroSlides(
          data.map((row) => ({
            id: row.id,
            headlineAr: row.headline_ar,
            headlineEn: row.headline_en ?? row.headline_ar,
            subheadlineAr: row.subheadline_ar ?? "",
            subheadlineEn: row.subheadline_en ?? "",
            imageUrl: row.image_url,
            videoUrl: row.video_url ?? undefined,
            overlayOpacity: row.overlay_opacity,
            overlayColor: (row.overlay_color as HeroSlide["overlayColor"]) ?? "black",
            textAlign: (row.text_align as HeroSlide["textAlign"]) ?? "center",
            heightPreset: (row.height_preset as HeroSlide["heightPreset"]) ?? "compact",
            ctaTextAr: row.cta_text_ar,
            ctaTextEn: row.cta_text_en ?? "",
            ctaLink: row.cta_link,
            secondaryCtaTextAr: row.secondary_cta_text_ar ?? undefined,
            secondaryCtaLink: row.secondary_cta_link ?? undefined,
            badgeText: row.badge_text ?? "",
            productOverlayUrl: row.product_overlay_url ?? undefined,
            hasAnimation: row.has_animation ?? true,
            headlineColor: row.headline_color ?? undefined,
            bodyColor: row.body_color ?? undefined,
            style: (row.style as HeroSlide["style"]) ?? undefined,
          })),
        );
      });
  }, []);
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => fetchProducts(50),
  });

  // Extract unique product types
  const productTypes = useMemo(() => {
    const types = new Set<string>();
    products.forEach(product => {
      if (product.node.productType) {
        types.add(product.node.productType);
      }
    });
    return Array.from(types).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.node.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Availability filter
    if (filterAvailability !== "all") {
      filtered = filtered.filter(product => {
        const available = product.node.variants.edges.some(v => v.node.availableForSale);
        return filterAvailability === "in-stock" ? available : !available;
      });
    }

    // Product type filter
    if (filterType !== "all") {
      filtered = filtered.filter(product => product.node.productType === filterType);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return parseFloat(a.node.priceRange.minVariantPrice.amount) - 
                 parseFloat(b.node.priceRange.minVariantPrice.amount);
        case "price-desc":
          return parseFloat(b.node.priceRange.minVariantPrice.amount) - 
                 parseFloat(a.node.priceRange.minVariantPrice.amount);
        case "title-asc":
          return a.node.title.localeCompare(b.node.title);
        case "title-desc":
          return b.node.title.localeCompare(a.node.title);
        case "featured":
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, sortBy, filterAvailability, filterType, searchQuery]);

  const handleResetFilters = () => {
    setSortBy("featured");
    setFilterAvailability("all");
    setFilterType("all");
  };

  useWebMCP({
    name: "search_store_products",
    description: "Search products on the shop page by title or description keyword.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term to filter product titles and descriptions" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    execute: ({ query }: { query: string }) =>
      runWebMCPTool("search_store_products", () => {
        setSearchParams(query ? { search: query } : {}, { replace: true });
        return `Search filter applied: "${query}".`;
      }),
  });

  useWebMCP({
    name: "list_visible_products",
    description: "Get a summary of products currently displayed on the shop page.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () =>
      runWebMCPTool("list_visible_products", () => {
        const shopifyLines = filteredProducts.slice(0, 15).map((p) => {
          const price = p.node.priceRange?.minVariantPrice;
          return `• [Shopify] ${p.node.title} - ${price?.currencyCode ?? ""} ${price?.amount ?? ""}`;
        });
        const localLines = localProducts.slice(0, 15).map(
          (p) => `• [${p.business_model}] ${p.title} - ${p.currency ?? "USD"} ${Number(p.price ?? 0).toFixed(2)}`,
        );
        const lines = [...shopifyLines, ...localLines];
        if (lines.length === 0) return "No products found matching active filters.";
        return `Showing ${lines.length} product(s):\n${lines.join("\n")}`;
      }),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Buy Egyptian Heritage Collections & Décor | HORUSIA</title>
        <meta name="description" content="Explore our curated catalog of handcrafted Egyptian statues, alabaster lamps, and heritage souvenirs. Verified supplier quality with fast delivery." />
        <meta property="og:title" content="Buy Egyptian Collections & Pharaoh Statues | HORUSIA" />
        <meta property="og:description" content="Explore verified Egyptian collections, dropship treasures, and handcrafted home accessories." />
        <meta property="og:image" content="https://eagles-veritas-shop.lovable.app/share-preview.jpg" />
        <meta property="og:url" content="https://eagles-veritas-shop.lovable.app/shop" />
        <link rel="canonical" href="https://eagles-veritas-shop.lovable.app/shop" />
      </Helmet>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://eagles-veritas-shop.lovable.app" },
          { name: "Shop", url: "https://eagles-veritas-shop.lovable.app/shop" }
        ]}
      />
      <Navbar />

      {shopHeroSlides.length > 0 && <HeroCarousel slides={shopHeroSlides} intervalMs={5000} />}

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary/15 to-accent/20 rounded-3xl mb-6 shadow-[var(--shadow-soft)]">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent mb-4">
            Shop All Products
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {searchQuery ? `Search results for "${searchQuery}"` : "Explore our complete collection of quality products"}
          </p>
        </div>

        {/* Filters */}
        {!isLoading && products.length > 0 && (
          <div className="mb-8 bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Filter & Sort</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="title-asc">Name: A to Z</SelectItem>
                    <SelectItem value="title-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Availability</label>
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Product Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="all">All Types</SelectItem>
                    {productTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={handleResetFilters}
                  className="w-full"
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block h-14 w-14 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-card to-card/80 rounded-3xl border-2 border-border shadow-[var(--shadow-medium)]">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/50 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold text-foreground mb-3">
              {products.length === 0 ? "No Products Found" : "No Products Match Your Filters"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {products.length === 0 
                ? "Our store is being set up. Please check back soon for our amazing products!"
                : "Try adjusting your filters or search query to find what you're looking for."
              }
            </p>
            {products.length > 0 && (
              <Button onClick={handleResetFilters} variant="outline">
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.node.id}
                product={product}
                onCompare={(item) => {
                  if (compareItems.length >= 4) return;
                  setCompareItems((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
                  setComparisonOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {localProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">Connected store products</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {localProducts.map((product) => {
                const item: CompareItem = {
                  id: product.id,
                  title: product.title,
                  price: Number(product.price ?? 0),
                  image: product.image_url ?? "/placeholder.svg",
                  category: product.category ?? "General",
                  affiliateUrl: product.business_model === "AFFILIATE" ? product.affiliate_url ?? undefined : undefined,
                };
                return (
                  <article key={product.id} className="space-y-3 rounded-xl border p-4">
                    <img src={item.image} alt={item.title} className="aspect-square w-full rounded-lg object-cover" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs rounded-full bg-secondary px-2 py-1">{product.business_model}</span>
                      <span className="text-xs text-muted-foreground">{product.currency}</span>
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    {product.description && <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}
                    <p className="font-bold text-primary">{item.price.toFixed(2)}</p>
                    <div className="flex gap-2">
                      {item.affiliateUrl ? (
                        <Button size="sm" className="flex-1" asChild><a href={item.affiliateUrl} target="_blank" rel="noopener noreferrer">Visit merchant</a></Button>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            addLocalItem({
                              productId: product.id,
                              title: item.title,
                              price: item.price,
                              currency: product.currency || "USD",
                              imageUrl: item.image,
                            });
                            toast.success(`"${item.title}" added to cart.`);
                          }}
                        >
                          <ShoppingCart className="mr-1 h-3.5 w-3.5" /> Add to cart
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (compareItems.length >= 4) return;
                          setCompareItems((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
                          setComparisonOpen(true);
                        }}
                      >
                        Compare
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {compareItems.length > 0 && (
          <Button className="fixed bottom-6 right-6 z-50" onClick={() => setComparisonOpen(true)}>
            Compare ({compareItems.length})
          </Button>
        )}
        <ProductComparisonModal
          items={compareItems}
          isOpen={comparisonOpen}
          onClose={() => setComparisonOpen(false)}
          onRemove={(id) => setCompareItems((current) => current.filter((item) => item.id !== id))}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
