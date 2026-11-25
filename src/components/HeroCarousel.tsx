import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeroSlide {
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

const ROTATE_MS = 6000;

export const HeroCarousel = ({ slides }: { slides: HeroSlide[] }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;
  const current = slides[index % count];

  return (
    <section
      className="relative h-[600px] flex items-center justify-center overflow-hidden group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === index % count;
        return (
          <div
            key={`${slide.imageUrl}-${i}`}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              active ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
            aria-hidden={!active}
          />
        );
      })}

      {/* Gradient overlay per active slide */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500"
        style={{ opacity: current.overlayOpacity / 100 }}
      />

      {/* Slide content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {current.badgeText && (
          <span className="mb-4 inline-block animate-fade-in rounded-full bg-amber-500/90 px-4 py-1.5 text-xs font-semibold text-navy-950">
            {current.badgeText}
          </span>
        )}
        <h1 className="mb-6 animate-fade-in bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-5xl font-bold text-foreground drop-shadow-lg md:text-7xl">
          {current.headlineAr}
        </h1>
        {current.subheadlineAr && (
          <p className="mx-auto mb-8 max-w-2xl animate-fade-in text-xl text-foreground md:text-2xl">
            {current.subheadlineAr}
          </p>
        )}
        <div className="flex animate-fade-in flex-col justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild variant="ghost">
            <Link to={current.ctaLink}>
              {current.ctaTextAr} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link to="/about">About Our Philosophy</Link>
          </Button>
        </div>
      </div>

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/50 group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/50 group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index % count ? "w-8 bg-amber-400" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
