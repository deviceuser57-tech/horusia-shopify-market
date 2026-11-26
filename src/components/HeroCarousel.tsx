import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
}

const HEIGHT_CLASSES: Record<NonNullable<HeroSlide["heightPreset"]>, string> = {
  compact: "h-[320px] md:h-[380px]",
  standard: "h-[450px] md:h-[520px]",
  full: "h-[580px] md:h-[650px]",
};

const ALIGN_CLASSES: Record<NonNullable<HeroSlide["textAlign"]>, string> = {
  right: "items-end text-right",
  center: "items-center text-center",
  left: "items-start text-left",
};

const overlayBackground = (color?: HeroSlide["overlayColor"]) => {
  if (color === "navy") return "bg-[#0B192C]";
  if (color === "gradient") return "bg-gradient-to-t from-[#0B192C] via-black/70 to-transparent";
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
  const current = slides[index % count];

  return (
    <section
      className={`relative ${HEIGHT_CLASSES[current.heightPreset ?? "standard"]} flex w-full select-none items-center justify-center overflow-hidden group`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === index % count;
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
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`h-full w-full bg-cover bg-center transition-transform duration-[7000ms] ease-out ${
                  slide.hasAnimation === false ? "" : active ? "scale-105" : "scale-100"
                }`}
                style={{ backgroundImage: `url(${slide.imageUrl})` }}
              />
            )}
          </div>
        );
      })}

      {/* Floating product overlay (ZOOS2-style focus product) */}
      {current.productOverlayUrl && (
        <div className="pointer-events-none absolute inset-0 z-[5] hidden items-center justify-center p-6 lg:flex">
          <div
            className={`relative aspect-square w-44 overflow-hidden rounded-2xl border border-amber-500/30 bg-black/50 shadow-2xl backdrop-blur-md transition-all duration-1000 ${
              current.hasAnimation === false ? "" : "animate-bounce shadow-amber-500/20 [animation-duration:4s]"
            }`}
          >
            <img
              src={current.productOverlayUrl}
              alt="Featured product"
              className="h-full w-full object-contain p-3"
            />
            <div className="absolute inset-x-2 bottom-2 rounded-lg border border-slate-800 bg-slate-950/90 p-1 text-center backdrop-blur-md">
              <span className="text-[10px] font-bold text-amber-300">Featured piece</span>
            </div>
          </div>
        </div>
      )}

      {/* Overlay tint */}
      <div
        className={`pointer-events-none absolute inset-0 ${overlayBackground(current.overlayColor)} transition-opacity duration-700`}
        style={{ opacity: current.overlayOpacity / 100 }}
      />

      {/* Slide content */}
      <div className={`relative z-10 container mx-auto flex flex-col px-6 ${ALIGN_CLASSES[current.textAlign ?? "center"]}`}>
        {current.badgeText && (
          <span className="mb-4 inline-block animate-fade-in rounded-full bg-amber-500/90 px-4 py-1.5 text-xs font-bold text-navy-950 shadow-md">
            {current.badgeText}
          </span>
        )}
        <h1 className="mb-4 max-w-4xl animate-fade-in text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
          {current.headlineAr}
        </h1>
        {current.subheadlineAr && (
          <p className="mb-6 max-w-2xl animate-fade-in text-base text-gray-200 drop-shadow sm:text-lg lg:text-xl">
            {current.subheadlineAr}
          </p>
        )}
        <div className="mt-2 flex animate-fade-in flex-wrap gap-3">
          <Button
            size="lg"
            className="bg-amber-500 px-6 font-bold text-navy-950 shadow-lg hover:bg-amber-400"
            asChild
          >
            <Link to={current.ctaLink}>
              {current.ctaTextAr} <ArrowRight className="mr-2 h-4 w-4" />
            </Link>
          </Button>
          {current.secondaryCtaTextAr && current.secondaryCtaLink && (
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white backdrop-blur hover:bg-white/10"
              asChild
            >
              <Link to={current.secondaryCtaLink}>{current.secondaryCtaTextAr}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur transition hover:bg-black/70 group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur transition hover:bg-black/70 group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index % count ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
