import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface HeroBannerConfig {
  headlineAr: string;
  headlineEn: string;
  subheadlineAr: string;
  imageUrl: string;
  overlayOpacity: number; // 0 to 100
  ctaTextAr: string;
  ctaLink: string;
  badgeText: string;
}

const defaults: HeroBannerConfig = {
  headlineAr: "طُمأنينة ڤيريتاس — فخامة التراث المصري",
  headlineEn: "Tumāninah Veritas — Timeless Luxury",
  subheadlineAr: "قطع فنية وتصاميم يدوية نادرة تصلك أينما كنت",
  imageUrl: "https://images.unsplash.com/photo-1572953109213-3be62398eb95?auto=format&fit=crop&w=1600&q=80",
  overlayOpacity: 45,
  ctaTextAr: "استكشف المجموعة التراثية",
  ctaLink: "/collections/egyptian-heritage",
  badgeText: "مجموعة حصرية 2026",
};

export const HeroBannerStudio = () => {
  const [config, setConfig] = useState<HeroBannerConfig>(() => {
    const stored = localStorage.getItem("tvs_hero_config");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  const handleSave = () => {
    localStorage.setItem("tvs_hero_config", JSON.stringify(config));
    toast.success("تم حفظ إعدادات الهيرو بانر وتطبيقها بنجاح!");
  };

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
          <Button onClick={handleSave} className="w-full">حفظ ونشر التعديلات</Button>
        </CardContent>
      </Card>

      {/* شاشة المعاينة الفورية (Live Preview) */}
      <div className="border rounded-xl overflow-hidden shadow-lg h-[400px] relative flex flex-col justify-center items-center text-center p-6 text-white">
        <img src={config.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover -z-10" />
        <div
          className="absolute inset-0 bg-black -z-10 transition-opacity"
          style={{ opacity: config.overlayOpacity / 100 }}
        />
        <span className="bg-amber-500/90 text-navy-950 font-semibold px-3 py-1 rounded-full text-xs mb-3">
          {config.badgeText}
        </span>
        <h2 className="text-3xl font-bold mb-2">{config.headlineAr}</h2>
        <p className="text-sm text-gray-200 mb-6">{config.subheadlineAr}</p>
        <Button variant="secondary" className="bg-amber-400 text-black hover:bg-amber-300">
          {config.ctaTextAr}
        </Button>
      </div>
    </div>
  );
};
