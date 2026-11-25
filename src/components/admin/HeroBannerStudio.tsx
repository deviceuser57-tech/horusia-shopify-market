import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface HeroBannerConfig {
  headlineAr: string;
  headlineEn: string;
  subheadlineAr: string;
  subheadlineEn: string;
  imageUrl: string;
  videoUrl: string;
  overlayOpacity: number; // 0 to 90
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
  isActive: boolean;
}

const defaults: HeroBannerConfig = {
  headlineAr: "طُمأنينة ڤيريتاس — فخامة التراث المصري",
  headlineEn: "Tumāninah Veritas — Timeless Luxury",
  subheadlineAr: "قطع فنية وتصاميم يدوية نادرة تصلك أينما كنت",
  subheadlineEn: "Rare art pieces and handcrafted designs delivered anywhere",
  imageUrl: "https://images.unsplash.com/photo-1572953109213-3be62398eb95?auto=format&fit=crop&w=1600&q=80",
  videoUrl: "",
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
  overlay_opacity: number;
  overlay_color: string;
  placement: string;
  height_preset: string;
  text_align: string;
  cta_text_ar: string;
  cta_text_en: string | null;
  cta_link: string;
  secondary_cta_text_ar: string | null;
  secondary_cta_link: string | null;
  badge_text: string | null;
  is_active: boolean;
  sort_order: number;
};

const asEnum = <T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const rowToConfig = (row: BannerRow): HeroBannerConfig => ({
  headlineAr: row.headline_ar,
  headlineEn: row.headline_en ?? "",
  subheadlineAr: row.subheadline_ar ?? "",
  subheadlineEn: row.subheadline_en ?? "",
  imageUrl: row.image_url,
  videoUrl: row.video_url ?? "",
  overlayOpacity: row.overlay_opacity,
  overlayColor: asEnum(row.overlay_color, ["black", "navy", "gradient"] as const, "black"),
  placement: asEnum(row.placement, ["home", "shop", "both"] as const, "home"),
  heightPreset: asEnum(row.height_preset, ["compact", "standard", "full"] as const, "standard"),
  textAlign: asEnum(row.text_align, ["right", "center", "left"] as const, "center"),
  ctaTextAr: row.cta_text_ar,
  ctaTextEn: row.cta_text_en ?? "",
  ctaLink: row.cta_link,
  secondaryCtaTextAr: row.secondary_cta_text_ar ?? "",
  secondaryCtaLink: row.secondary_cta_link ?? "",
  badgeText: row.badge_text ?? "",
  isActive: row.is_active,
});

const SELECT_FIELDS =
  "id,headline_ar,headline_en,subheadline_ar,subheadline_en,image_url,video_url,overlay_opacity,overlay_color,placement,height_preset,text_align,cta_text_ar,cta_text_en,cta_link,secondary_cta_text_ar,secondary_cta_link,badge_text,is_active,sort_order";

const buildPayload = (config: HeroBannerConfig) => ({
  headline_ar: config.headlineAr,
  headline_en: config.headlineEn || null,
  subheadline_ar: config.subheadlineAr || null,
  subheadline_en: config.subheadlineEn || null,
  image_url: config.imageUrl,
  video_url: config.videoUrl || null,
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
  is_active: config.isActive,
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
      toast.error(`Could not load hero banner configuration: ${error.message}`);
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
    setConfig({ ...defaults, headlineAr: "", headlineEn: "", imageUrl: "", videoUrl: "" });
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

  const requireSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error("Sign in with an admin account (OWNER role) to publish the hero banner.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!(await requireSession())) return;
    setSaving(true);
    try {
      const payload = buildPayload(config);
      const { error } = rowId
        ? await supabase.from("hero_banner_configs").update(payload).eq("id", rowId)
        : await supabase.from("hero_banner_configs").insert(payload);

      if (error) throw error;
      toast.success("Hero banner saved and published to the storefront.");
      await loadSlides(rowId);
    } catch (err) {
      toast.error(`Save failed: ${(err as { message?: string })?.message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const duplicateSlide = async () => {
    if (!(await requireSession())) return;
    setSaving(true);
    const { error } = await supabase
      .from("hero_banner_configs")
      .insert({ ...buildPayload(config), is_active: config.isActive });
    setSaving(false);
    if (error) toast.error(`Duplicate failed: ${error.message}`);
    else {
      toast.success("New slide added to the carousel.");
      await loadSlides();
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
    <div className="space-y-6 p-6">
      {/* شريط اختيار الشرائح */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-muted-foreground">الشرائح ({slides.length}):</span>
        {slides.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => selectSlide(row)}
            className={`relative h-14 w-24 overflow-hidden rounded-md border-2 transition ${
              row.id === rowId ? "border-amber-400" : "border-transparent opacity-70 hover:opacity-100"
            }`}
            title={row.headline_ar}
          >
            {row.video_url ? (
              <video src={row.video_url} className="h-full w-full object-cover" muted />
            ) : (
              <img src={row.image_url} alt="" className="h-full w-full object-cover" />
            )}
            <span
              className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full ${
                row.is_active ? "bg-emerald-400" : "bg-gray-500"
              }`}
            />
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={startNewSlide}>
          <Plus className="mr-1 h-4 w-4" /> شريحة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* لوحة التحكم */}
        <Card>
          <CardHeader>
            <CardTitle>{rowId ? "تعديل الشريحة" : "شريحة جديدة"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>مكان العرض</Label>
                <Select
                  value={config.placement}
                  onValueChange={(v) => setConfig({ ...config, placement: v as HeroBannerConfig["placement"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">الرئيسية + المتجر</SelectItem>
                    <SelectItem value="home">الصفحة الرئيسية فقط</SelectItem>
                    <SelectItem value="shop">صفحة المتجر فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ارتفاع البانر</Label>
                <Select
                  value={config.heightPreset}
                  onValueChange={(v) => setConfig({ ...config, heightPreset: v as HeroBannerConfig["heightPreset"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">مضغوط (350px)</SelectItem>
                    <SelectItem value="standard">قياسي (500px)</SelectItem>
                    <SelectItem value="full">كامل (650px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>طراز التعتيم</Label>
                <Select
                  value={config.overlayColor}
                  onValueChange={(v) => setConfig({ ...config, overlayColor: v as HeroBannerConfig["overlayColor"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="navy">كحلي ملكي</SelectItem>
                    <SelectItem value="gradient">تدرج كحلي/ذهبي</SelectItem>
                    <SelectItem value="black">أسود كلاسيكي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>محاذاة النص</Label>
                <Select
                  value={config.textAlign}
                  onValueChange={(v) => setConfig({ ...config, textAlign: v as HeroBannerConfig["textAlign"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">وسط</SelectItem>
                    <SelectItem value="right">يمين</SelectItem>
                    <SelectItem value="left">يسار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
              <Label>رابط فيديو متحرك (اختياري MP4)</Label>
              <Input
                placeholder="https://.../video.mp4"
                value={config.videoUrl}
                onChange={(e) => setConfig({ ...config, videoUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>نسبة التعتيم: {config.overlayOpacity}%</Label>
              <Slider
                min={0}
                max={90}
                step={5}
                value={[config.overlayOpacity]}
                onValueChange={([val]) => setConfig({ ...config, overlayOpacity: val })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>نص الزر الرئيسي</Label>
                <Input value={config.ctaTextAr} onChange={(e) => setConfig({ ...config, ctaTextAr: e.target.value })} />
              </div>
              <div>
                <Label>رابط الزر الرئيسي</Label>
                <Input value={config.ctaLink} onChange={(e) => setConfig({ ...config, ctaLink: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>نص الزر الثانوي (اختياري)</Label>
                <Input value={config.secondaryCtaTextAr} onChange={(e) => setConfig({ ...config, secondaryCtaTextAr: e.target.value })} />
              </div>
              <div>
                <Label>رابط الزر الثانوي</Label>
                <Input value={config.secondaryCtaLink} onChange={(e) => setConfig({ ...config, secondaryCtaLink: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="hero-active">عرض في السلايدر</Label>
              <Switch
                id="hero-active"
                checked={config.isActive}
                onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "جاري الحفظ..." : rowId ? "حفظ الشريحة" : "إضافة شريحة"}
              </Button>
              {rowId && (
                <>
                  <Button variant="outline" disabled={saving} onClick={() => void duplicateSlide()}>
                    نسخ
                  </Button>
                  <Button variant="outline" size="icon" disabled={saving} onClick={() => void deleteSlide(rowId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* المعاينة الحية */}
        <div className="flex flex-col justify-center">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">معاينة مباشرة:</h3>
          <div
            className={`relative flex w-full flex-col justify-center overflow-hidden rounded-2xl p-6 text-white shadow-2xl ${
              config.textAlign === "right"
                ? "items-end text-right"
                : config.textAlign === "left"
                  ? "items-start text-left"
                  : "items-center text-center"
            } ${config.heightPreset === "compact" ? "h-[350px]" : config.heightPreset === "full" ? "h-[550px]" : "h-[450px]"}`}
          >
            {config.videoUrl ? (
              <video src={config.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 -z-10 h-full w-full object-cover" />
            ) : (
              <img src={config.imageUrl} alt="Preview" className="absolute inset-0 -z-10 h-full w-full object-cover" />
            )}
            <div
              className={`absolute inset-0 -z-10 transition-opacity ${
                config.overlayColor === "navy"
                  ? "bg-[#0B192C]"
                  : config.overlayColor === "gradient"
                    ? "bg-gradient-to-t from-[#0B192C] via-black/70 to-transparent"
                    : "bg-black"
              }`}
              style={{ opacity: config.overlayOpacity / 100 }}
            />
            {config.badgeText && (
              <span className="mb-3 self-center rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-navy-950">
                {config.badgeText}
              </span>
            )}
            <h2 className="mb-2 text-2xl font-extrabold md:text-3xl">{config.headlineAr}</h2>
            {config.subheadlineAr && <p className="mb-4 max-w-md text-sm text-gray-200">{config.subheadlineAr}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-amber-500 font-bold text-navy-950 hover:bg-amber-400">
                {config.ctaTextAr}
              </Button>
              {config.secondaryCtaTextAr && (
                <Button size="sm" variant="outline" className="border-white/50 text-white">
                  {config.secondaryCtaTextAr}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
