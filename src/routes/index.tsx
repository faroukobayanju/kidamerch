import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { categories } from "@/data/products";
import { useData } from "@/lib/data-store";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/whatsapp";
import { Reveal, Stagger, StaggerItem, EASE } from "@/components/Reveal";

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
  const reduce = useReducedMotion();

  const step = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.15 + i * 0.12, ease: EASE },
  });

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex min-h-[60svh] max-w-7xl flex-col justify-center px-5 pb-20 pt-12 sm:px-8 md:min-h-[calc(100svh-5rem)] md:pb-28">
        <div className="relative">
          <div className="hero-glow pointer-events-none absolute -left-10 -top-16 h-72 w-72 opacity-50" />
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
