import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HeroBannerConfig {
  headlineAr: string;
  headlineEn: string;
  subheadlineAr: string;
  subheadlineEn: string;
  imageUrl: string;
  overlayOpacity: number;
  ctaTextAr: string;
  ctaTextEn: string;
  ctaLink: string;
  badgeText: string;
}

const defaults: HeroBannerConfig = {
  headlineAr: "طُمأنينة ڤيريتاس",
  headlineEn: "Tumāninah Veritas",
  subheadlineAr: "فخامة التراث المصري وجودة الاختيار",
  subheadlineEn: "Egyptian heritage and modern quality",
  imageUrl: "/assets/hero-banner.jpg",
  overlayOpacity: 45,
  ctaTextAr: "استكشف المجموعة",
  ctaTextEn: "Shop now",
  ctaLink: "/shop",
  badgeText: "مجموعة مختارة",
};

export const HeroBannerStudio = () => {
  const [config, setConfig] = useState<HeroBannerConfig>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("hero_banner_configs")
      .select("*")
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setConfig({
          headlineAr: data.headline_ar,
          headlineEn: data.headline_en ?? "",
          subheadlineAr: data.subheadline_ar ?? "",
          subheadlineEn: data.subheadline_en ?? "",
          imageUrl: data.image_url,
          overlayOpacity: data.overlay_opacity,
          ctaTextAr: data.cta_text_ar,
          ctaTextEn: data.cta_text_en ?? "",
          ctaLink: data.cta_link,
          badgeText: data.badge_text ?? "",
        });
      });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("hero_banner_configs").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase.from("hero_banner_configs").insert({
      headline_ar: config.headlineAr,
      headline_en: config.headlineEn,
      subheadline_ar: config.subheadlineAr,
      subheadline_en: config.subheadlineEn,
      image_url: config.imageUrl,
      overlay_opacity: config.overlayOpacity,
      cta_text_ar: config.ctaTextAr,
      cta_text_en: config.ctaTextEn,
      cta_link: config.ctaLink,
      badge_text: config.badgeText,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast.error("The hero configuration could not be saved.");
      return;
    }
    toast.success("Hero banner published.");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Hero banner</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Arabic headline</Label><Input value={config.headlineAr} onChange={(e) => setConfig({ ...config, headlineAr: e.target.value })} /></div>
          <div><Label>English headline</Label><Input value={config.headlineEn} onChange={(e) => setConfig({ ...config, headlineEn: e.target.value })} /></div>
          <div><Label>Arabic subheadline</Label><Input value={config.subheadlineAr} onChange={(e) => setConfig({ ...config, subheadlineAr: e.target.value })} /></div>
          <div><Label>Image URL</Label><Input value={config.imageUrl} onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })} /></div>
          <div><Label>Overlay opacity: {config.overlayOpacity}%</Label><Slider min={0} max={90} step={5} value={[config.overlayOpacity]} onValueChange={([value]) => setConfig({ ...config, overlayOpacity: value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CTA text</Label><Input value={config.ctaTextAr} onChange={(e) => setConfig({ ...config, ctaTextAr: e.target.value })} /></div>
            <div><Label>CTA link</Label><Input value={config.ctaLink} onChange={(e) => setConfig({ ...config, ctaLink: e.target.value })} /></div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full">{saving ? "Publishing..." : "Publish hero"}</Button>
        </CardContent>
      </Card>
      <div className="relative flex h-[400px] items-center justify-center overflow-hidden rounded-xl text-center text-white">
        <img src={config.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black" style={{ opacity: config.overlayOpacity / 100 }} />
        <div className="relative z-10 max-w-xl px-6">
          {config.badgeText && <p className="mb-3 text-sm font-semibold">{config.badgeText}</p>}
          <h2 className="mb-3 text-4xl font-bold">{config.headlineAr}</h2>
          <p className="mb-5">{config.subheadlineAr}</p>
          <Button variant="secondary">{config.ctaTextAr}</Button>
        </div>
      </div>
    </div>
  );
};
