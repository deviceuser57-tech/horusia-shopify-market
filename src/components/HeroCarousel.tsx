import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Layers, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeroSlide {
  id?: string;
  headlineAr: string;
  headlineEn?: string;
  subheadlineAr?: string;
  subheadlineEn?: string;
  imageUrl: string;
  videoUrl?: string;
  overlayOpacity: number;
  overlayColor?: "black" | "navy" | "gradient";
  textAlign?: "right" | "center" | "left";
  heightPreset?: "compact" | "standard" | "full";
  ctaTextAr: string;
  ctaTextEn?: string;
  ctaLink: string;
  secondaryCtaTextAr?: string;
  secondaryCtaLink?: string;
  badgeText?: string;
  productOverlayUrl?: string;
  hasAnimation?: boolean;
  headlineColor?: string;
  bodyColor?: string;
  style?: HeroSlideStyle;
}

export interface HeroSlideStyle {
  headlineFont?: string;
  bodyFont?: string;
  badgeBg?: string;
  badgeText?: string;
  ctaBg?: string;
  ctaText?: string;
  secondaryCtaBg?: string;
  secondaryCtaText?: string;
  textPanel?: "none" | "glass" | "solid";
  panelColor?: string;
  panelOpacity?: number;
}

const HEIGHT_CLASSES: Record<NonNullable<HeroSlide["heightPreset"]>, string> = {
  compact: "min-h-[380px] lg:min-h-[430px]",
  standard: "min-h-[460px] lg:min-h-[540px]",
  full: "min-h-[560px] lg:min-h-[640px]",
};

export const HeroCarousel = ({
  slides,
  intervalMs = 6000,
}: {
  slides: HeroSlide[];
  intervalMs?: number;
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => setActiveSlide((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(timer);
  }, [count, paused, intervalMs]);

  if (count === 0) return null;
  const safeIndex = activeSlide >= count ? 0 : activeSlide;
  const current = slides[safeIndex];
  const go = (dir: 1 | -1) =>
    setActiveSlide((prev) => (dir === 1 ? (prev < count - 1 ? prev + 1 : 0) : prev > 0 ? prev - 1 : count - 1));

  return (
    <section
      className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/40 via-background to-secondary/40 py-6 transition-colors lg:py-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl space-y-6 px-4 lg:space-y-8 lg:px-8">
        {/* ===== Main Hero Banner Box — exact ZOOS2 split-panel layout ===== */}
        <div
          className={`group relative overflow-hidden rounded-3xl border bg-card shadow-xl transition-all duration-500 ${HEIGHT_CLASSES[current.heightPreset ?? "standard"]} ${
            current.hasAnimation === false
              ? "border-border shadow-foreground/10"
              : "border-gold/40 shadow-gold ring-1 ring-gold/30"
          }`}
        >
          <div className="grid h-full grid-cols-1 lg:grid-cols-12">
            {/* ===== Left Content Column ===== */}
            <div className="z-10 flex flex-col justify-between gap-6 p-6 sm:p-10 lg:col-span-6 lg:p-12">
              <div className="space-y-4">
                {/* Store kicker + animated badge */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-gold">
                  <span className="h-2 w-2 animate-ping rounded-full bg-gold" />
                  <span className="uppercase tracking-widest">HORUSIA</span>
                  <span className="text-muted-foreground">·</span>
                  {current.badgeText && (
                    <span
                      className="rounded bg-gold/10 px-2 py-0.5 font-semibold text-foreground"
                      style={{
                        backgroundColor: current.style?.badgeBg ?? undefined,
                        color: current.style?.badgeText ?? undefined,
                      }}
                    >
                      {current.badgeText}
                    </span>
                  )}
                  {current.hasAnimation !== false && (
                    <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                      <Sparkles className="h-3 w-3" />
                      <span>Live Motion Special</span>
                    </span>
                  )}
                </div>

                {/* Main headline */}
                <h1
                  className="animate-fade-in text-balance text-2xl font-extrabold leading-[1.2] text-foreground sm:text-4xl lg:text-[2.5rem]"
                  style={{
                    color: current.headlineColor ?? undefined,
                    fontFamily: current.style?.headlineFont || undefined,
                  }}
                >
                  {current.headlineAr}
                </h1>

                {/* Subtitle */}
                {current.subheadlineAr && (
                  <p
                    className="max-w-lg animate-fade-in text-xs leading-relaxed text-muted-foreground sm:text-sm"
                    style={{
                      color: current.bodyColor ?? undefined,
                      fontFamily: current.style?.bodyFont || undefined,
                    }}
                  >
                    {current.subheadlineAr}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="px-6 text-xs font-bold shadow-lg sm:text-sm"
                    style={{
                      backgroundColor: current.style?.ctaBg ?? "hsl(var(--primary))",
                      color: current.style?.ctaText ?? "hsl(var(--primary-foreground))",
                    }}
                    asChild
                  >
                    <Link to={current.ctaLink}>
                      {current.ctaTextAr} {current.ctaTextEn ? ` / ${current.ctaTextEn}` : ""}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  {current.secondaryCtaTextAr && current.secondaryCtaLink && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-gold/40 text-xs hover:bg-gold/10 sm:text-sm"
                      style={{
                        color: current.style?.secondaryCtaText ?? undefined,
                        borderColor: current.style?.secondaryCtaBg ?? undefined,
                      }}
                      asChild
                    >
                      <Link to={current.secondaryCtaLink}>{current.secondaryCtaTextAr}</Link>
                    </Button>
                  )}
                </div>

                {/* Slide dots + counter */}
                <div className="flex items-center gap-2 pt-2">
                  {slides.map((slide, idx) => (
                    <button
                      key={slide.id ?? idx}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        safeIndex === idx ? "w-8 bg-gold" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                  <span className="ms-2 font-mono text-[11px] text-muted-foreground">
                    0{safeIndex + 1} / 0{count}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== Right Media Column ===== */}
            <div className="relative order-first flex min-h-[300px] items-center justify-center overflow-hidden bg-[#0A192F] lg:order-none lg:col-span-6 lg:min-h-full">
              {/* Stacked slides crossfade — exact ZOOS2 behavior */}
              {slides.map((slide, i) => {
                const active = i === safeIndex;
                return (
                  <div
                    key={slide.id ?? `${slide.imageUrl}-${i}`}
                    className={`absolute inset-0 transition-opacity duration-700 ${active ? "z-0 opacity-100" : "-z-10 opacity-0"}`}
                    aria-hidden={!active}
                  >
                    {slide.videoUrl ? (
                      <video
                        src={slide.videoUrl}
                        autoPlay={active}
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <img
                        src={slide.imageUrl}
                        alt={slide.headlineEn ?? slide.headlineAr}
                        className={`h-full w-full object-cover object-center transition-all duration-700 ${
                          slide.hasAnimation === false ? "hover:scale-105" : active ? "scale-105" : "scale-100"
                        }`}
                        loading={active ? "eager" : "lazy"}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                );
              })}

              {/* Shading gradient overlays — exact ZOOS2 */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0A192F]/40 to-transparent lg:bg-gradient-to-r" />

              {/* Multi-image product overlay (ZOOS2 Featured Deal card) */}
              {current.productOverlayUrl && (
                <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center p-6">
                  <div
                    className={`relative aspect-square w-48 overflow-hidden rounded-2xl border border-white/20 bg-black/40 shadow-2xl backdrop-blur-sm transition-all duration-1000 sm:w-64 md:w-72 ${
                      current.hasAnimation === false ? "" : "animate-bounce ring-2 ring-gold/60 shadow-gold [animation-duration:3.5s]"
                    }`}
                  >
                    <img
                      src={current.productOverlayUrl}
                      alt="Product Spotlight"
                      className="h-full w-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-2 bottom-2 rounded-lg border border-border bg-background/85 p-1.5 text-center backdrop-blur-md">
                      <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-gold">
                        <Layers className="h-3 w-3" />
                        <span>Featured Deal</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating slide switcher pill — exact ZOOS2 prev/next arrows */}
              {count > 1 && (
                <div className="absolute bottom-4 end-4 z-10 flex items-center gap-1.5 rounded-xl border border-border bg-background/85 p-1.5 text-xs text-foreground shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="rounded-lg p-1.5 transition-colors hover:bg-secondary"
                    aria-label="Previous"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="px-2 font-semibold">HORUSIA Deals</span>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="rounded-lg p-1.5 transition-colors hover:bg-secondary"
                    aria-label="Next"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Trust Badges Bar — exact ZOOS2 ===== */}
        <div className="grid grid-cols-1 gap-4 border-t border-border pt-2 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="rounded-xl bg-gold/10 p-2.5 text-gold">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">Direct Dropship & Store Pickup</p>
              <p className="text-[11px] text-muted-foreground">Expedited courier or instant pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">100% Quality Guaranteed</p>
              <p className="text-[11px] text-muted-foreground">Verified sourcing & authentic products</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">Cash on Delivery & Easy Returns</p>
              <p className="text-[11px] text-muted-foreground">Pay when you receive your order</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
