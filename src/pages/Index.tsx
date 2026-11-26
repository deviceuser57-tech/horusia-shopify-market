import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { EgyptianPopup } from "@/components/EgyptianPopup";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchLatestProducts } from "@/lib/shopify";
import { OrganizationSchema, WebSiteSchema } from "@/components/StructuredData";
import heroBanner from "@/assets/hero-banner.jpg";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Index = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    {
      headlineAr: "Tumāninah Veritas Store",
      headlineEn: "Tumāninah Veritas Store",
      subheadlineAr: "One Stop Store - Quality products, trusted service, modern lifestyle.",
      subheadlineEn: "One Stop Store - Quality products, trusted service, modern lifestyle.",
      imageUrl: heroBanner,
      overlayOpacity: 45,
      ctaTextAr: "Shop Now",
      ctaTextEn: "Shop Now",
      ctaLink: "/shop",
      badgeText: "",
    },
  ]);

  useEffect(() => {
    supabase
      .from("hero_banner_configs")
      .select("id,headline_ar,headline_en,subheadline_ar,subheadline_en,image_url,video_url,overlay_opacity,overlay_color,placement,height_preset,text_align,cta_text_ar,cta_text_en,cta_link,secondary_cta_text_ar,secondary_cta_link,badge_text,sort_order,product_overlay_url,has_animation,headline_color,body_color,style")
      .eq("is_active", true)
      .in("placement", ["home", "both"])
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setHeroSlides(
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
            heightPreset: (row.height_preset as HeroSlide["heightPreset"]) ?? "standard",
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

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubscribing(true);

    const email = newsletterEmail.trim().toLowerCase();
    const { error } = await supabase
      .from("newsletter_subscriptions")
      .insert({ email, source: "homepage" });

    if (error) {
      if (error.code === "23505") {
        toast.info("This email is already subscribed.");
      } else {
        toast.error("We could not complete your subscription. Please try again.");
      }
    } else {
      toast.success("Subscription confirmed.");
      setNewsletterEmail("");
    }

    setIsSubscribing(false);
  };

  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => fetchProducts(8),
  });

  const { data: latestProducts, isLoading: loadingLatest } = useQuery({
    queryKey: ['latest-products'],
    queryFn: () => fetchLatestProducts(8),
  });

  return (
    <>
      <Helmet>
        <title>Tumāninah Veritas Store | Buy Handcrafted Egyptian Heritage Gifts</title>
        <meta name="description" content="Shop authentic Egyptian heritage treasures, handmade replicas, and luxury pharaonic home decor with secure international shipping." />
        <meta property="og:title" content="Tumāninah Veritas Store | Egyptian Heritage Artifacts" />
        <meta property="og:description" content="Direct from Cairo artisans: handcrafted replicas, bespoke jewelry, and pharaonic styling." />
        <meta property="og:image" content="https://eagles-veritas-shop.lovable.app/share-preview.jpg" />
        <meta property="og:url" content="https://eagles-veritas-shop.lovable.app/" />
        <link rel="canonical" href="https://eagles-veritas-shop.lovable.app/" />
      </Helmet>
      <Navbar />
      <EgyptianPopup />
      <OrganizationSchema
        name="Tumāninah Veritas Store"
        description="One Stop Store - Quality products, trusted service, modern lifestyle"
        url="https://eagles-veritas-shop.lovable.app"
        socialLinks={[
          "https://www.facebook.com/profile.php?id=61583352851718",
          "https://www.instagram.com/tumaninahveritasstore/",
          "https://www.tiktok.com/@tumaninah_veritas_store"
        ]}
        contactEmail="contact@tumaninahveritas.com"
      />
      <WebSiteSchema
        name="Tumāninah Veritas Store"
        url="https://eagles-veritas-shop.lovable.app"
        description="One Stop Store offering quality products with trusted service for a modern lifestyle"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section - animated carousel of active banners */}
        <HeroCarousel slides={heroSlides} />

        {/* Latest Arrivals */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-4">
                <Clock className="h-5 w-5 text-accent-foreground" />
                <span className="text-sm font-semibold text-accent-foreground">NEW ARRIVALS</span>
              </div>
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Latest Products
              </h2>
              <p className="text-muted-foreground text-lg">
                Fresh additions to our collection
              </p>
            </div>
            
            {loadingLatest ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : latestProducts && latestProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestProducts.map((product) => (
                  <ProductCard key={product.node.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No new products yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Featured Products
            </h2>
            <p className="text-muted-foreground text-lg">
              Discover our handpicked selection of premium items
            </p>
          </div>
          
          {loadingFeatured ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                    <ProductCard key={product.node.id} product={product} />
                ))}
            </div>
          ) : (
            <div className="text-center py-20">
                <h2 className="text-muted-foreground text-lg mb-4 text-foreground">No products found</h2>
              <Button asChild variant="outline">
                <Link to="/shop">View All Products</Link>
              </Button>
            </div>
          )}
        </section>

        {/* About Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-foreground">
                Our Philosophy
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
                At Tumāninah Veritas Store, we believe in providing more than just products.
                We offer a curated experience of quality, trust, and modern living.
              </p>
              <Button variant="outline" size="lg" asChild>
                <Link to="/about">
                  Learn More <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20 container mx-auto px-4">
          <div className="bg-card/50 backdrop-blur rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for exclusive offers and updates
            </p>
            <form
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={handleNewsletterSubmit}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-background"
                required
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
              />
              <Button type="submit" size="lg" disabled={isSubscribing}>
                {isSubscribing ? "Subscribing..." : "Subscribe"}
                {!isSubscribing && <Sparkles className="ml-2 h-4 w-4" />}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Index;