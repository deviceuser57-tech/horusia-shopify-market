import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SocialAdBundle {
  tiktok: { hook: string; script: string; callToAction: string; hashtags: string[] };
  instagram: { caption: string; headline: string; hashtags: string[] };
  google: { headlines: string[]; descriptions: string[] };
}

type AdFormat = "video" | "image" | "carousel";

export function ProductSocialAdModal({
  product,
  open,
  onClose,
}: {
  product: {
    id: string;
    title: string;
    price: number;
    description?: string | null;
    category?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
  };
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<SocialAdBundle | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [format, setFormat] = useState<AdFormat>("video");
  const images = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];

  const fallbackAds = (): SocialAdBundle => ({
    tiktok: {
      hook: `POV: You just brought authentic ancient Egyptian craftsmanship to your living room.`,
      script: `Unboxing the ${product.title}. Handcrafted with museum-grade accuracy and shipped straight from Egypt. Priced at just $${product.price}.`,
      callToAction: "Tap the link in bio to secure yours before this batch sells out!",
      hashtags: ["#EgyptianDecor", "#Tutankhamun", "#LuxuryHome", "#TikTokShop"],
    },
    instagram: {
      headline: `Elevate your sanctuary with timeless Egyptian heritage.`,
      caption: `Every artifact tells a 3,000-year story. The ${product.title} combines authentic historic motifs with bespoke modern luxury. Available now with worldwide tracked shipping.`,
      hashtags: ["#EgyptianHeritage", "#AncientEgypt", "#InteriorStyling", "#ArtCollector"],
    },
    google: {
      headlines: [
        `Handcrafted ${product.title.slice(0, 25)}`,
        `Authentic Egyptian Art - $${product.price}`,
        `Worldwide Delivery from Cairo`,
      ],
      descriptions: [
        `Discover genuine handcrafted Egyptian heritage decor. Shop the ${product.title} today.`,
        `Direct from Cairo artisans. Secure checkout with guaranteed authenticity & fast shipping.`,
      ],
    },
  });

  const generateAds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-enrich", {
        body: {
          mode: "SOCIAL_ADS",
          productId: product.id,
          rawName: product.title,
          category: product.category ?? "Heritage Décor",
          adFormat: format,
        },
      });
      if (error || !data?.ads) throw error ?? new Error("No ads payload");
      setAds(data.ads as SocialAdBundle);
      toast.success("Ad creatives generated!");
    } catch {
      setAds(fallbackAds());
      toast.info("Generated ad templates (offline fallback mode).");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Social Media Ads Studio
          </DialogTitle>
          <DialogDescription>
            Generate targeted multi-platform ad copy for <strong>{product.title}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Product preview + format picker */}
        <div className="flex gap-4 rounded-lg border bg-muted/30 p-3">
          {images[0] ? (
            <img src={images[0]} alt={product.title} className="h-20 w-20 shrink-0 rounded-md object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">No image</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.title}</p>
            <p className="text-xs text-muted-foreground">
              {product.category ?? "General"} · ${product.price.toFixed(2)}
              {images.length > 1 ? ` · ${images.length} images` : ""}
            </p>
            {product.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Ad format:</span>
          {([["video", "Video Reel (9:16)"], ["image", "Static Image (1:1)"], ["carousel", "Carousel (4:5)"]] as const).map(([v, label]) => (
            <Button key={v} type="button" size="sm" variant={format === v ? "default" : "outline"} onClick={() => setFormat(v)}>
              {label}
            </Button>
          ))}
        </div>

        {!ads ? (
          <div className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Create ready-to-publish scripts and copy for TikTok, Instagram, and Google Ads tailored to this product.
            </p>
            <Button onClick={() => void generateAds()} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Ad Creatives
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="tiktok" className="mt-2">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="tiktok">TikTok / Reels</TabsTrigger>
              <TabsTrigger value="instagram">Instagram / Meta</TabsTrigger>
              <TabsTrigger value="google">Google Ads</TabsTrigger>
            </TabsList>

            <TabsContent value="tiktok" className="space-y-3 pt-3">
              <div className="space-y-2 rounded border bg-muted/40 p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Hook (0-3s)</div>
                <p className="text-sm font-medium">{ads.tiktok.hook}</p>
                <div className="pt-2 text-xs font-semibold uppercase text-muted-foreground">Full Script</div>
                <p className="whitespace-pre-wrap text-sm">{ads.tiktok.script}</p>
                <div className="pt-2 text-xs font-semibold uppercase text-muted-foreground">Call to Action</div>
                <p className="text-sm text-amber-500">{ads.tiktok.callToAction}</p>
                <p className="text-xs text-muted-foreground">{ads.tiktok.hashtags.join(" ")}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => copyText(`${ads.tiktok.hook}\n\n${ads.tiktok.script}\n\n${ads.tiktok.callToAction}\n\n${ads.tiktok.hashtags.join(" ")}`, "tiktok")}>
                {copiedKey === "tiktok" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy TikTok Script & Hashtags
              </Button>
            </TabsContent>

            <TabsContent value="instagram" className="space-y-3 pt-3">
              <div className="space-y-2 rounded border bg-muted/40 p-3">
                <p className="text-sm font-semibold">{ads.instagram.headline}</p>
                <p className="whitespace-pre-wrap text-sm">{ads.instagram.caption}</p>
                <p className="text-xs text-muted-foreground">{ads.instagram.hashtags.join(" ")}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => copyText(`${ads.instagram.headline}\n\n${ads.instagram.caption}\n\n${ads.instagram.hashtags.join(" ")}`, "instagram")}>
                {copiedKey === "instagram" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Instagram Caption
              </Button>
            </TabsContent>

            <TabsContent value="google" className="space-y-3 pt-3">
              <div className="space-y-2 rounded border bg-muted/40 p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Headlines</div>
                {ads.google.headlines.map((hl, i) => (
                  <p key={i} className="text-sm font-medium text-blue-500">{hl}</p>
                ))}
                <div className="pt-2 text-xs font-semibold uppercase text-muted-foreground">Descriptions</div>
                {ads.google.descriptions.map((desc, i) => (
                  <p key={i} className="text-sm">{desc}</p>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => copyText(ads.google.headlines.join(" | ") + "\n\n" + ads.google.descriptions.join("\n"), "google")}>
                {copiedKey === "google" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Search Headlines & Descriptions
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {ads && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-amber-600">Production guide — {format === "video" ? "9:16 vertical video" : format === "image" ? "1:1 static image" : "4:5 carousel"}</p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
              {format === "video" && <><li>Hook in first 3 seconds with product hero shot on clean background</li><li>Show 3 benefit close-ups, then price + CTA end card</li><li>Caption file: include hook + CTA + 3 hashtags</li></>}
              {format === "image" && <><li>Use hero image with 20% text-safe zone for headline overlay</li><li>Export at 1080×1080px, sRGB, under 30MB</li><li>Add price badge graphic in corner</li></>}
              {format === "carousel" && <><li>Slide 1: hero shot + headline — Slides 2-3: details/features — Slide 4: CTA + offer</li><li>Export 1080×1350px per slide, consistent brand frame</li><li>Write per-slide caption in notes</li></>}
              <li>Always disclose #ad and keep claims evidence-safe</li>
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
