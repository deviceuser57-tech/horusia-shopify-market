import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
  compact: "min-h-[380px] lg:min-h-[420px]",
  standard: "min-h-[460px] lg:min-h-[540px]",
  full: "min-h-[560px] lg:min-h-[640px]",
};

const ALIGN_CLASSES: Record<NonNullable<HeroSlide["textAlign"]>, string> = {
  right: "items-end text-right",
  center: "items-center text-center",
  left: "items-start text-left",
};

const overlayBackground = (color?: HeroSlide["overlayColor"]) => {
  if (color === "navy") return "bg-[#0A192F]";
  if (color === "gradient") return "bg-gradient-to-t lg:bg-gradient-to-r from-[#0A192F] via-[#0A192F]/60 to-transparent";
  return "bg-black";
};

export const HeroCarousel = ({
  slides,
  intervalMs = 6000,
}: {
  slides: HeroSlide[];
  intervalMs?: number;
}) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(timer);
  }, [count, paused, intervalMs]);

  if (count === 0) return null;
  const safeIndex = index % count;
  const current = slides[safeIndex];
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  return (
    <section
      className="w-full select-none px-4 py-6 sm:px-6 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`group relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-all duration-500 ${
          current.hasAnimation === false
            ? "border-border"
            : "border-gold/30 shadow-gold ring-1 ring-gold/20"
        } ${HEIGHT_CLASSES[current.heightPreset ?? "standard"]}`}
      >
        <div className="grid h-full grid-cols-1 lg:grid-cols-12">
          {/* ===== Left: content column (ZOOS2-style) ===== */}
          <div
            className={`relative z-10 flex flex-col justify-between gap-6 p-6 sm:p-10 lg:col-span-6 lg:p-12 ${ALIGN_CLASSES[current.textAlign ?? "left"]}`}
          >
            <div className={`space-y-4 ${current.style?.textPanel === "glass" ? "rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-md" : ""}`}>
              {/* Kicker row: brand + badge + motion badge */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-gold">
                <span className="h-2 w-2 animate-ping rounded-full bg-gold" />
                <span className="uppercase tracking-widest">HORUSIA</span>
                <span className="text-muted-foreground">·</span>
                {current.badgeText && (
                  <span
                    className="rounded border border-gold/30 bg-gold/10 px-2 py-0.5 font-semibold text-foreground"
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

              {/* Headline */}
              <h1
                className="animate-fade-in text-balance text-2xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-[2.75rem]"
                style={{
                  color: current.headlineColor ?? "hsl(var(--foreground))",
                  fontFamily: current.style?.headlineFont || undefined,
                }}
              >
                {current.headlineAr}
              </h1>

              {/* Subheadline */}
              {current.subheadlineAr && (
                <p
                  className="max-w-lg animate-fade-in text-sm leading-relaxed text-muted-foreground sm:text-base"
                  style={{
                    color: current.bodyColor ?? undefined,
                    fontFamily: current.style?.bodyFont || undefined,
                  }}
                >
                  {current.subheadlineAr}
                </p>
              )}
            </div>

            {/* CTAs + dots/counter */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="px-6 font-bold shadow-lg"
                  style={{
                    backgroundColor: current.style?.ctaBg ?? "hsl(var(--primary))",
                    color: current.style?.ctaText ?? "hsl(var(--primary-foreground))",
                  }}
                  asChild
                >
                  <Link to={current.ctaLink}>
                    {current.ctaTextAr} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {current.secondaryCtaTextAr && current.secondaryCtaLink && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gold/40 hover:bg-gold/10"
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

              {/* Dots + slide counter */}
              <div className="flex items-center gap-2 pt-1">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id ?? i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      safeIndex === i ? "w-8 bg-gold" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                    }`}
                  />
                ))}
                <span className="ms-2 font-mono text-[11px] text-muted-foreground">
                  0{safeIndex + 1} / 0{count}
                </span>
              </div>
            </div>
          </div>

          {/* ===== Right: media column ===== */}
          <div className="relative order-first min-h-[280px] overflow-hidden bg-[#0A192F] lg:order-none lg:col-span-6 lg:min-h-full">
            {/* Stacked slides crossfade */}
            {slides.map((slide, i) => {
              const active = i === safeIndex;
              return (
                <div
                  key={slide.id ?? `${slide.imageUrl}-${i}`}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    active ? "z-0 opacity-100" : "-z-10 opacity-0"
                  }`}
                  aria-hidden={!active}
                >
                  {slide.videoUrl ? (
                    <video
                      src={slide.videoUrl}
                      autoPlay={active}
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={slide.imageUrl}
                      alt={slide.headlineEn ?? slide.headlineAr}
                      className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${
                        slide.hasAnimation === false ? "" : active ? "scale-105" : "scale-100"
                      }`}
                      loading={active ? "eager" : "lazy"}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              );
            })}

            {/* Gradient shading */}
            <div className={`pointer-events-none absolute inset-0 ${overlayBackground(current.overlayColor)}`} style={{ opacity: current.overlayOpacity / 100 }} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0A192F] via-[#0A192F]/30 to-transparent" />

            {/* Floating product overlay (ZOOS2 focus product card) */}
            {current.productOverlayUrl && (
              <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center p-6">
                <div
                  className={`relative aspect-square w-44 overflow-hidden rounded-2xl border border-gold/40 bg-black/40 shadow-2xl backdrop-blur-md transition-all duration-1000 sm:w-56 ${
                    current.hasAnimation === false ? "" : "animate-bounce shadow-gold [animation-duration:3.5s]"
                  }`}
                >
                  <img
                    src={current.productOverlayUrl}
                    alt="Featured product"
                    className="h-full w-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-2 bottom-2 rounded-lg border border-border bg-background/90 p-1.5 text-center backdrop-blur-md">
                    <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-gold">
                      <Sparkles className="h-3 w-3" />
                      Featured piece
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Floating slide switcher pill (prev/next arrows) */}
            {count > 1 && (
              <div className="absolute bottom-4 end-4 z-10 flex items-center gap-1.5 rounded-xl border border-border bg-background/85 p-1.5 text-xs text-foreground shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  aria-label="Previous slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="px-2 font-semibold">HORUSIA Deals</span>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  aria-label="Next slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Large edge arrows (always visible on touch, hover on desktop) */}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(-1)}
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground opacity-70 backdrop-blur transition hover:bg-background/90 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(1)}
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground opacity-70 backdrop-blur transition hover:bg-background/90 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};
