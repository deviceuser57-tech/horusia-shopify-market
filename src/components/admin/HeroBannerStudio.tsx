import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";

export interface HeroBannerConfig {
  headlineAr: string;
  headlineEn: string;
  subheadlineAr: string;
  subheadlineEn: string;
  imageUrl: string;
  videoUrl: string;
  productOverlayUrl: string;
  overlayOpacity: number;
  overlayColor: "black" | "navy" | "gradient";
  placement: "home" | "shop" | "both";
  heightPreset: "compact" | "standard" | "full";
  textAlign: "right" | "center" | "left";
  ctaTextAr: string;
  ctaTextEn: string;
  ctaLink: string;
  secondaryCtaTextAr: string;
  secondaryCtaLink: string;
  badgeText: string;
  hasAnimation: boolean;
  sortOrder: number;
  isActive: boolean;
}

const defaults: HeroBannerConfig = {
  headlineAr: "طُمأنينة ڤيريتاس — فخامة التراث المصري",
  headlineEn: "Tumāninah Veritas — Timeless Luxury",
  subheadlineAr: "قطع فنية وتصاميم يدوية نادرة تصلك أينما كنت",
  subheadlineEn: "Rare art pieces and handcrafted designs delivered anywhere",
  imageUrl: "https://images.unsplash.com/photo-1572953109213-3be62398eb95?auto=format&fit=crop&w=1600&q=80",
  videoUrl: "",
  productOverlayUrl: "",
  overlayOpacity: 45,
  overlayColor: "navy",
  placement: "both",
  heightPreset: "standard",
  textAlign: "center",
  ctaTextAr: "استكشف المجموعة التراثية",
  ctaTextEn: "Explore the Heritage Collection",
  ctaLink: "/shop",
  secondaryCtaTextAr: "",
  secondaryCtaLink: "",
  badgeText: "مجموعة حصرية 2026",
  hasAnimation: true,
  sortOrder: 0,
  isActive: true,
};

type BannerRow = {
  id: string;
  headline_ar: string;
  headline_en: string | null;
  subheadline_ar: string | null;
  subheadline_en: string | null;
  image_url: string;
  video_url: string | null;
  product_overlay_url: string | null;
  overlay_opacity: number;
  overlay_color: string | null;
  placement: string | null;
  height_preset: string | null;
  text_align: string | null;
  cta_text_ar: string;
  cta_text_en: string | null;
  cta_link: string;
  secondary_cta_text_ar: string | null;
  secondary_cta_link: string | null;
  badge_text: string | null;
  has_animation: boolean | null;
  sort_order: number | null;
  is_active: boolean;
};

const rowToConfig = (row: BannerRow): HeroBannerConfig => ({
  headlineAr: row.headline_ar,
  headlineEn: row.headline_en ?? "",
  subheadlineAr: row.subheadline_ar ?? "",
  subheadlineEn: row.subheadline_en ?? "",
  imageUrl: row.image_url,
  videoUrl: row.video_url ?? "",
  productOverlayUrl: row.product_overlay_url ?? "",
  overlayOpacity: row.overlay_opacity,
  overlayColor: (row.overlay_color as HeroBannerConfig["overlayColor"]) ?? "navy",
  placement: (row.placement as HeroBannerConfig["placement"]) ?? "both",
  heightPreset: (row.height_preset as HeroBannerConfig["heightPreset"]) ?? "standard",
  textAlign: (row.text_align as HeroBannerConfig["textAlign"]) ?? "center",
  ctaTextAr: row.cta_text_ar,
  ctaTextEn: row.cta_text_en ?? "",
  ctaLink: row.cta_link,
  secondaryCtaTextAr: row.secondary_cta_text_ar ?? "",
  secondaryCtaLink: row.secondary_cta_link ?? "",
  badgeText: row.badge_text ?? "",
  hasAnimation: row.has_animation ?? true,
  sortOrder: row.sort_order ?? 0,
  isActive: row.is_active,
});

const SELECT_FIELDS =
  "id,headline_ar,headline_en,subheadline_ar,subheadline_en,image_url,video_url,product_overlay_url,overlay_opacity,overlay_color,placement,height_preset,text_align,cta_text_ar,cta_text_en,cta_link,secondary_cta_text_ar,secondary_cta_link,badge_text,has_animation,sort_order,is_active";

const buildPayload = (config: HeroBannerConfig) => ({
  headline_ar: config.headlineAr,
  headline_en: config.headlineEn || null,
  subheadline_ar: config.subheadlineAr || null,
  subheadline_en: config.subheadlineEn || null,
  image_url: config.imageUrl,
  video_url: config.videoUrl || null,
  product_overlay_url: config.productOverlayUrl || null,
  overlay_opacity: Math.min(Math.max(Math.round(config.overlayOpacity), 0), 90),
  overlay_color: config.overlayColor,
  placement: config.placement,
  height_preset: config.heightPreset,
  text_align: config.textAlign,
  cta_text_ar: config.ctaTextAr,
  cta_text_en: config.ctaTextEn || null,
  cta_link: config.ctaLink,
  secondary_cta_text_ar: config.secondaryCtaTextAr || null,
  secondary_cta_link: config.secondaryCtaLink || null,
  badge_text: config.badgeText || null,
  has_animation: config.hasAnimation,
  sort_order: config.sortOrder,
  is_active: config.isActive,
});

const configToSlide = (config: HeroBannerConfig): HeroSlide => ({
  headlineAr: config.headlineAr,
  subheadlineAr: config.subheadlineAr,
  imageUrl: config.imageUrl,
  videoUrl: config.videoUrl || undefined,
  overlayOpacity: config.overlayOpacity,
  overlayColor: config.overlayColor,
  textAlign: config.textAlign,
  heightPreset: config.heightPreset,
  ctaTextAr: config.ctaTextAr,
  ctaLink: config.ctaLink,
  secondaryCtaTextAr: config.secondaryCtaTextAr || undefined,
  secondaryCtaLink: config.secondaryCtaLink || undefined,
  badgeText: config.badgeText,
  productOverlayUrl: config.productOverlayUrl || undefined,
  hasAnimation: config.hasAnimation,
});

export const HeroBannerStudio = () => {
  const [config, setConfig] = useState<HeroBannerConfig>(defaults);
  const [rowId, setRowId] = useState<string | null>(null);
  const [slides, setSlides] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSlides = async (keepId?: string | null) => {
    const { data, error } = await supabase
      .from("hero_banner_configs")
      .select(SELECT_FIELDS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load hero banner configuration.");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as BannerRow[];
    setSlides(rows);
    const target = rows.find((r) => r.id === (keepId ?? rowId)) ?? rows[0];
    if (target) {
      setRowId(target.id);
      setConfig(rowToConfig(target));
    } else {
      setRowId(null);
      setConfig(defaults);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSlide = (row: BannerRow) => {
    setRowId(row.id);
    setConfig(rowToConfig(row));
  };

  const startNewSlide = () => {
    setRowId(null);
    setConfig({ ...defaults, headlineAr: "", headlineEn: "", imageUrl: "", sortOrder: slides.length });
  };

  const deleteSlide = async (id: string) => {
    if (!window.confirm("Delete this slide?")) return;
    const { error } = await supabase.from("hero_banner_configs").delete().eq("id", id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success("Slide deleted.");
    await loadSlides(rowId === id ? null : rowId);
  };

  const saveSlide = async (asNew: boolean) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Sign in with an admin account (OWNER role) to publish the hero banner.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(config);
      const { error } = !asNew && rowId
        ? await supabase.from("hero_banner_configs").update(payload).eq("id", rowId)
        : await supabase.from("hero_banner_configs").insert(payload);
      if (error) throw error;
      toast.success(asNew ? "Slide duplicated." : "Hero banner saved and published to the storefront.");
      await loadSlides(rowId);
    } catch (err) {
      toast.error(`Save failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const previewSlides: HeroSlide[] = [configToSlide(config)];

  return (
    <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-5">
      {/* Slide selector */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Slides ({slides.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slides.map((row) => (
            <div
              key={row.id}
              className={`flex cursor-pointer items-center justify-between rounded-md border p-2 text-sm transition ${
                row.id === rowId ? "border-amber-500 bg-amber-500/10" : "hover:bg-muted/50"
              }`}
              onClick={() => selectSlide(row)}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{row.headline_ar}</p>
                <p className="text-xs text-muted-foreground">
                  {row.placement ?? "home"} · {row.is_active ? "active" : "hidden"}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); void deleteSlide(row.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={startNewSlide}>
            + New slide
          </Button>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Banner settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Placement</Label>
              <Select value={config.placement} onValueChange={(v) => setConfig({ ...config, placement: v as HeroBannerConfig["placement"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home only</SelectItem>
                  <SelectItem value="shop">Shop only</SelectItem>
                  <SelectItem value="both">Both pages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Height</Label>
              <Select value={config.heightPreset} onValueChange={(v) => setConfig({ ...config, heightPreset: v as HeroBannerConfig["heightPreset"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact (350px)</SelectItem>
                  <SelectItem value="standard">Standard (500px)</SelectItem>
                  <SelectItem value="full">Full (620px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Text align</Label>
              <Select value={config.textAlign} onValueChange={(v) => setConfig({ ...config, textAlign: v as HeroBannerConfig["textAlign"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Overlay style</Label>
              <Select value={config.overlayColor} onValueChange={(v) => setConfig({ ...config, overlayColor: v as HeroBannerConfig["overlayColor"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="navy">Royal navy</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="gradient">Navy-gold gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Headline (AR)</Label>
            <Input value={config.headlineAr} onChange={(e) => setConfig({ ...config, headlineAr: e.target.value })} />
          </div>
          <div>
            <Label>Headline (EN)</Label>
            <Input value={config.headlineEn} onChange={(e) => setConfig({ ...config, headlineEn: e.target.value })} />
          </div>
          <div>
            <Label>Subheadline (AR)</Label>
            <Input value={config.subheadlineAr} onChange={(e) => setConfig({ ...config, subheadlineAr: e.target.value })} />
          </div>
          <div>
            <Label>Background image URL</Label>
            <Input value={config.imageUrl} onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })} />
          </div>
          <div>
            <Label>Background video URL (MP4, optional)</Label>
            <Input placeholder="https://.../video.mp4" value={config.videoUrl} onChange={(e) => setConfig({ ...config, videoUrl: e.target.value })} />
          </div>
          <div>
            <Label>Floating product image URL (optional)</Label>
            <Input placeholder="https://.../product.png" value={config.productOverlayUrl} onChange={(e) => setConfig({ ...config, productOverlayUrl: e.target.value })} />
          </div>
          <div>
            <Label>Overlay opacity: {config.overlayOpacity}%</Label>
            <Slider min={0} max={90} step={5} value={[config.overlayOpacity]} onValueChange={([val]) => setConfig({ ...config, overlayOpacity: val })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Primary CTA text</Label>
              <Input value={config.ctaTextAr} onChange={(e) => setConfig({ ...config, ctaTextAr: e.target.value })} />
            </div>
            <div>
              <Label>Primary CTA link</Label>
              <Input value={config.ctaLink} onChange={(e) => setConfig({ ...config, ctaLink: e.target.value })} />
            </div>
            <div>
              <Label>Secondary CTA text</Label>
              <Input value={config.secondaryCtaTextAr} onChange={(e) => setConfig({ ...config, secondaryCtaTextAr: e.target.value })} />
            </div>
            <div>
              <Label>Secondary CTA link</Label>
              <Input value={config.secondaryCtaLink} onChange={(e) => setConfig({ ...config, secondaryCtaLink: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Badge text</Label>
              <Input value={config.badgeText} onChange={(e) => setConfig({ ...config, badgeText: e.target.value })} />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={config.sortOrder} onChange={(e) => setConfig({ ...config, sortOrder: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="hero-anim">Animation effects (Ken Burns + product bounce)</Label>
            <Switch id="hero-anim" checked={config.hasAnimation} onCheckedChange={(checked) => setConfig({ ...config, hasAnimation: checked })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="hero-active">Active (visible on storefront)</Label>
            <Switch id="hero-active" checked={config.isActive} onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void saveSlide(false)} disabled={saving} className="flex-1">
              {saving ? "Saving..." : rowId ? "Save slide" : "Add slide"}
            </Button>
            {rowId && (
              <Button variant="outline" disabled={saving} onClick={() => void saveSlide(true)}>
                <Copy className="mr-1 h-4 w-4" /> Duplicate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live preview — real carousel component */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Live preview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <HeroCarousel slides={previewSlides} intervalMs={config.hasAnimation ? 6000 : 999999} />
        </CardContent>
      </Card>
    </div>
  );
};
