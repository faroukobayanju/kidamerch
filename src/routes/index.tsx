import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import heroImg from "@/assets/hero-figure.jpg";
import { categories, formatPrice } from "@/data/products";
import { useData } from "@/lib/data-store";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/whatsapp";
import { Reveal, Stagger, StaggerItem, EASE } from "@/components/Reveal";

type Slide = { src: string; label: string; caption: string; price: number | null };

const FALLBACK_SLIDE: Slide = {
  src: heroImg,
  label: "New season",
  caption: "KIDA — now taking orders",
  price: null,
};

/**
 * Cross-fading product slideshow. Pauses on hover, respects reduced motion and
 * reports the active slide so the caption card can stay in sync.
 */
function HeroSlideshow({
  slides,
  index,
  onIndexChange,
}: {
  slides: [Slide, ...Slide[]];
  index: number;
  onIndexChange: (i: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused || reduce || slides.length < 2) return;
    const t = setInterval(() => onIndexChange((index + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, [paused, reduce, slides.length, index, onIndexChange]);

  const active: Slide = slides[index] ?? slides[0];

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.img
          key={index}
          src={active.src}
          alt={active.caption}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center gap-2 p-4">
          {slides.map((s, n) => (
            <button
              key={s.caption}
              type="button"
              onClick={() => onIndexChange(n)}
              aria-label={`Show ${s.caption}`}
              aria-current={n === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                n === index ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KIDA — Anime Merch" },
      {
        name: "description",
        content:
          "Heavyweight apparel, hand-finished figures, accessories and numbered prints from an independent anime merch studio. Order on WhatsApp.",
      },
      { property: "og:title", content: "KIDA — Anime Merch" },
      {
        property: "og:description",
        content: "Independent anime merch in small runs. Order and confirm on WhatsApp.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <>
      <Hero />
      <NewArrivals />
      <CategoryTiles />
    </>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { storefrontProducts } = useData();
  const [slide, setSlide] = useState(0);

  /**
   * Built from the live catalogue so newly published products appear here.
   * Falls back to the brand image while the store is still empty.
   */
  const heroSlides = useMemo<[Slide, ...Slide[]]>(() => {
    const withImages = storefrontProducts.filter((p) => p.images[0]);
    if (!withImages.length) return [FALLBACK_SLIDE];
    return withImages.slice(0, 5).map((p) => ({
      src: p.images[0]!,
      label: p.category as string,
      caption: p.name,
      price: p.price,
    })) as [Slide, ...Slide[]];
  }, [storefrontProducts]);

  // Keep the index valid when the catalogue changes underneath us.
  useEffect(() => {
    if (slide >= heroSlides.length) setSlide(0);
  }, [heroSlides.length, slide]);

  const active = heroSlides[slide] ?? heroSlides[0];

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);

  const step = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.15 + i * 0.12, ease: EASE },
  });

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 md:min-h-[calc(100svh-5rem)] md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:pb-24">
        <div className="relative order-2 md:order-1">
          <motion.h1
            {...step(1)}
            className="display-xl text-[11.5vw] leading-[1.05] sm:text-6xl lg:text-7xl"
          >
            Bring your
            <br />
            favorite worlds
            <br />
            <span className="text-primary">closer</span>.
          </motion.h1>
          <motion.p
            {...step(2)}
            className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground"
          >
            KIDA lets anime fans carry the worlds they love into the real world.
          </motion.p>
          <motion.div {...step(3)} className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="eyebrow inline-flex h-14 items-center gap-2 rounded-sm bg-primary px-7 text-primary-foreground transition-opacity duration-200 hover:opacity-90"
            >
              Shop the collection <ArrowRight size={15} />
            </Link>
            <a
              href={whatsappUrl("Hi KIDA! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Order on WhatsApp"
              className="inline-flex h-14 w-14 items-center justify-center rounded-sm border border-border transition-colors duration-200 hover:bg-secondary"
            >
              <WhatsAppIcon size={18} />
            </a>
          </motion.div>
        </div>

        <div className="relative order-1 md:order-2">
          <div className="hero-glow pointer-events-none absolute inset-x-6 top-10 h-2/3 opacity-60" />
          <motion.div
            style={{ y, scale }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative aspect-[4/5] overflow-hidden rounded-sm border border-border bg-surface-2 shadow-lift"
          >
            <HeroSlideshow slides={heroSlides} index={slide} onIndexChange={setSlide} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
            className="absolute -bottom-5 left-4 rounded-sm border border-border bg-background px-5 py-4 shadow-elevate sm:left-8"
          >
            <p className="eyebrow text-[10px] text-muted-foreground">{active.label}</p>
            <p className="mt-1 text-sm font-semibold">{active.caption}</p>
            {active.price !== null && (
              <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(active.price)}</p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pb-8">
      <div className="min-w-0">
        <p className="eyebrow text-primary">{eyebrow}</p>
        <h2 className="display-xl mt-3 text-4xl sm:text-5xl">{title}</h2>
      </div>
      {action && (
        <Link
          to={action.to as never}
          className="eyebrow inline-flex shrink-0 items-center gap-1.5 pb-2 text-[10px] text-muted-foreground transition-colors duration-150 hover:text-primary"
        >
          {action.label} <ArrowUpRight size={13} />
        </Link>
      )}
    </div>
  );
}

function NewArrivals() {
  const { storefrontProducts } = useData();
  const featured = storefrontProducts.slice(0, 6);

  // Nothing published yet — hide the section rather than show an empty grid.
  if (!featured.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 pt-24 sm:px-8">
      <Reveal>
        <SectionHead
          eyebrow="New arrivals"
          title="Fresh off the rack"
          action={{ label: "All items", to: "/shop" }}
        />
      </Reveal>
      <Stagger className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">
        {featured.map((p) => (
          <StaggerItem key={p.id}>
            <ProductCard product={p} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function CategoryTiles() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-24 sm:px-8">
      <Reveal>
        <SectionHead eyebrow="Browse" title="By category" />
      </Reveal>
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <StaggerItem key={c.name}>
            <Link
              to="/shop"
              search={{ category: c.name } as never}
              className="group relative block aspect-[16/10] overflow-hidden rounded-sm border border-border sm:aspect-[4/5]"
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-ink/45 transition-colors duration-300 group-hover:bg-ink/25" />
              <span className="absolute inset-x-0 bottom-0 p-5">
                <span className="display-xl block text-2xl text-white">{c.name}</span>
                <span className="mt-1 block text-xs text-white/70">{c.blurb}</span>
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
