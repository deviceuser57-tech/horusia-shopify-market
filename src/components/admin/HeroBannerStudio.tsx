import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface HeroBannerConfig {
  headlineAr: string;
  headlineEn: string;
  subheadlineAr: string;
  subheadlineEn: string;
  imageUrl: string;
  overlayOpacity: number; // 0 to 90
  ctaTextAr: string;
  ctaTextEn: string;
  ctaLink: string;
  badgeText: string;
  isActive: boolean;
}

const defaults: HeroBannerConfig = {
  headlineAr: "طُمأنينة ڤيريتاس — فخامة التراث المصري",
  headlineEn: "Tumāninah Veritas — Timeless Luxury",
  subheadlineAr: "قطع فنية وتصاميم يدوية نادرة تصلك أينما كنت",
  subheadlineEn: "Rare art pieces and handcrafted designs delivered anywhere",
  imageUrl: "https://images.unsplash.com/photo-1572953109213-3be62398eb95?auto=format&fit=crop&w=1600&q=80",
  overlayOpacity: 45,
  ctaTextAr: "استكشف المجموعة التراثية",
  ctaTextEn: "Explore the Heritage Collection",
  ctaLink: "/shop",
  badgeText: "مجموعة حصرية 2026",
  isActive: true,
};

type BannerRow = {
  id: string;
  headline_ar: string;
  headline_en: string | null;
  subheadline_ar: string | null;
  subheadline_en: string | null;
  image_url: string;
  overlay_opacity: number;
  cta_text_ar: string;
  cta_text_en: string | null;
  cta_link: string;
  badge_text: string | null;
  is_active: boolean;
};

const rowToConfig = (row: BannerRow): HeroBannerConfig => ({
  headlineAr: row.headline_ar,
  headlineEn: row.headline_en ?? "",
  subheadlineAr: row.subheadline_ar ?? "",
  subheadlineEn: row.subheadline_en ?? "",
  imageUrl: row.image_url,
  overlayOpacity: row.overlay_opacity,
  ctaTextAr: row.cta_text_ar,
  ctaTextEn: row.cta_text_en ?? "",
  ctaLink: row.cta_link,
  badgeText: row.badge_text ?? "",
  isActive: row.is_active,
});

export const HeroBannerStudio = () => {
  const [config, setConfig] = useState<HeroBannerConfig>(defaults);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("hero_banner_configs")
      .select("id,headline_ar,headline_en,subheadline_ar,subheadline_en,image_url,overlay_opacity,cta_text_ar,cta_text_en,cta_link,badge_text,is_active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error("Could not load hero banner configuration.");
        } else if (data) {
          setRowId(data.id);
          setConfig(rowToConfig(data as BannerRow));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Sign in with an admin account (OWNER role) to publish the hero banner.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        headline_ar: config.headlineAr,
        headline_en: config.headlineEn || null,
        subheadline_ar: config.subheadlineAr || null,
        subheadline_en: config.subheadlineEn || null,
        image_url: config.imageUrl,
        overlay_opacity: Math.min(Math.max(Math.round(config.overlayOpacity), 0), 90),
        cta_text_ar: config.ctaTextAr,
        cta_text_en: config.ctaTextEn || null,
        cta_link: config.ctaLink,
        badge_text: config.badgeText || null,
        is_active: config.isActive,
      };

      // Only one banner may be active (unique partial index).
      if (config.isActive) {
        await supabase
          .from("hero_banner_configs")
          .update({ is_active: false })
          .eq("is_active", true)
          .neq("id", rowId ?? "00000000-0000-0000-0000-000000000000");
      }

      const { error } = rowId
        ? await supabase.from("hero_banner_configs").update(payload).eq("id", rowId)
        : await supabase.from("hero_banner_configs").insert(payload);

      if (error) throw error;
      toast.success("Hero banner saved and published to the storefront.");
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
      {/* لوحة التحكم */}
      <Card>
        <CardHeader><CardTitle>إعدادات البانر الترويجي</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>العنوان الرئيسي (عربي)</Label>
            <Input value={config.headlineAr} onChange={(e) => setConfig({ ...config, headlineAr: e.target.value })} />
          </div>
          <div>
            <Label>العنوان الرئيسي (إنجليزي)</Label>
            <Input value={config.headlineEn} onChange={(e) => setConfig({ ...config, headlineEn: e.target.value })} />
          </div>
          <div>
            <Label>رابط صورة الخلفية (Image URL)</Label>
            <Input value={config.imageUrl} onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })} />
          </div>
          <div>
            <Label>نسبة تعتيم الظل: {config.overlayOpacity}%</Label>
            <Slider
              min={0}
              max={90}
              step={5}
              value={[config.overlayOpacity]}
              onValueChange={([val]) => setConfig({ ...config, overlayOpacity: val })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نص الزر (CTA)</Label>
              <Input value={config.ctaTextAr} onChange={(e) => setConfig({ ...config, ctaTextAr: e.target.value })} />
            </div>
            <div>
              <Label>رابط الزر</Label>
              <Input value={config.ctaLink} onChange={(e) => setConfig({ ...config, ctaLink: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="hero-active">نشر البانر على الصفحة الرئيسية</Label>
            <Switch
              id="hero-active"
              checked={config.isActive}
              onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "جاري الحفظ..." : "حفظ ونشر التعديلات"}
          </Button>
        </CardContent>
      </Card>

      {/* شاشة المعاينة الفورية (Live Preview) */}
      <div className="border rounded-xl overflow-hidden shadow-lg h-[400px] relative flex flex-col justify-center items-center text-center p-6 text-white">
        <img src={config.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover -z-10" />
        <div
          className="absolute inset-0 bg-black -z-10 transition-opacity"
          style={{ opacity: config.overlayOpacity / 100 }}
        />
        {config.badgeText && (
          <span className="bg-amber-500/90 text-navy-950 font-semibold px-3 py-1 rounded-full text-xs mb-3">
            {config.badgeText}
          </span>
        )}
        <h2 className="text-3xl font-bold mb-2">{config.headlineAr}</h2>
        {config.subheadlineAr && <p className="text-sm text-gray-200 mb-6">{config.subheadlineAr}</p>}
        <Button variant="secondary" className="bg-amber-400 text-black hover:bg-amber-300" asChild>
          <a href={config.ctaLink}>{config.ctaTextAr}</a>
        </Button>
      </div>
    </div>
  );
};
