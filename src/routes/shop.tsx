import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  categories,
  formatPrice,
  PRICE_FALLBACK_MAX,
  PRICE_FALLBACK_MIN,
  type Category,
} from "@/data/products";
import { useData } from "@/lib/data-store";
import { ProductCard } from "@/components/ProductCard";
import { EASE } from "@/components/Reveal";

type Sort = "newest" | "price-asc" | "price-desc" | "popular";

/**
 * Price slider bounds, derived from the catalogue so the range always covers
 * every product. Rounded to the nearest ₦5,000 to match the slider step.
 * Falls back to a fixed range while the catalogue is empty, since Math.min of
 * an empty list returns Infinity and would hide everything.
 */
const round5k = (n: number, dir: "up" | "down") =>
  (dir === "up" ? Math.ceil(n / 5000) : Math.floor(n / 5000)) * 5000;

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search["category"] === "string" ? { category: search["category"] as string } : {},

  head: () => ({
    meta: [
      { title: "Shop All — KIDA" },
      {
        name: "description",
        content:
          "Browse every piece in the KIDA catalogue: apparel, figures, accessories and numbered prints. Filter by category, price and availability.",
      },
      { property: "og:title", content: "Shop All — KIDA" },
      {
        property: "og:description",
        content: "Every piece in the catalogue: apparel, figures, accessories and prints.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const { storefrontProducts: products } = useData();
  const initial = categories.find((c) => c.name === search.category)?.name;

  // Bounds follow the live catalogue, so the slider always covers every product.
  const [PRICE_MIN, PRICE_MAX] = useMemo(() => {
    if (!products.length) return [PRICE_FALLBACK_MIN, PRICE_FALLBACK_MAX];
    const prices = products.map((p) => p.price);
    return [round5k(Math.min(...prices), "down"), round5k(Math.max(...prices), "up")];
  }, [products]);

  const [selected, setSelected] = useState<Category[]>(initial ? [initial] : []);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Widen the slider once products arrive, otherwise everything filters out.
  useEffect(() => setMaxPrice(PRICE_MAX), [PRICE_MAX]);

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        (selected.length === 0 || selected.includes(p.category)) &&
        p.price <= maxPrice &&
        (!inStockOnly || p.inStock),
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "popular") sorted.sort((a, b) => b.popularity - a.popularity);
    if (sort === "newest") sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return sorted;
  }, [products, selected, maxPrice, inStockOnly, sort]);

  const reset = () => {
    setSelected([]);
    setMaxPrice(PRICE_MAX);
    setInStockOnly(false);
  };

  const filters = (
    <Filters
      selected={selected}
      setSelected={setSelected}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      inStockOnly={inStockOnly}
      setInStockOnly={setInStockOnly}
      reset={reset}
      countFor={(c) => products.filter((p) => p.category === c).length}
      priceMin={PRICE_MIN}
      priceMax={PRICE_MAX}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pb-8">
        <div className="min-w-0">
          <p className="eyebrow text-primary">Catalogue</p>
          <h1 className="display-xl mt-3 text-5xl sm:text-6xl">All items</h1>
        </div>
        <p className="shrink-0 pb-2 text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {products.length}
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rule-line py-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="eyebrow inline-flex h-11 items-center gap-2 rounded-sm border border-border px-4 lg:hidden"
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
        <span className="hidden lg:block" />
        <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-11 rounded-sm border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="popular">Popularity</option>
          </select>
        </label>
      </div>

      <div className="grid gap-8 pt-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filters}</div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <EmptyResults onReset={reset} />
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6 2xl:grid-cols-5"
            >
              <AnimatePresence initial={false}>
                {filtered.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[85] bg-ink/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[90] max-h-[85svh] overflow-y-auto rounded-t-xl border-t border-border bg-background p-6 lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.38, ease: EASE }}
            >
              <div className="flex items-center justify-between pb-6">
                <p className="display-xl text-xl">Filters</p>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border"
                >
                  <X size={18} />
                </button>
              </div>
              {filters}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="eyebrow mt-8 h-14 w-full rounded-sm bg-primary text-primary-foreground"
              >
                Show {filtered.length} items
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Filters({
  selected,
  setSelected,
  maxPrice,
  setMaxPrice,
  inStockOnly,
  setInStockOnly,
  reset,
  countFor,
  priceMin,
  priceMax,
}: {
  selected: Category[];
  setSelected: (next: Category[]) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  inStockOnly: boolean;
  setInStockOnly: (b: boolean) => void;
  reset: () => void;
  countFor: (category: Category) => number;
  priceMin: number;
  priceMax: number;
}) {
  const toggle = (c: Category) =>
    setSelected(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-[10px] text-muted-foreground">Category</p>
        <div className="mt-4 space-y-1">
          {categories.map((c) => {
            const active = selected.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggle(c.name)}
                aria-pressed={active}
                className={`flex h-11 w-full items-center justify-between rounded-sm px-3 text-sm transition-colors duration-150 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {c.name}
                <span className="text-xs opacity-70 tabular-nums">{countFor(c.name)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="eyebrow text-[10px] text-muted-foreground">Max price</p>
          <p className="text-sm font-semibold tabular-nums text-primary">{formatPrice(maxPrice)}</p>
        </div>
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum price"
          className="mt-4 h-11 w-full accent-[var(--primary)]"
        />
      </div>

      <div>
        <p className="eyebrow text-[10px] text-muted-foreground">Availability</p>
        <button
          type="button"
          onClick={() => setInStockOnly(!inStockOnly)}
          aria-pressed={inStockOnly}
          className="mt-4 flex h-11 w-full items-center gap-3 rounded-sm px-3 text-sm hover:bg-secondary"
        >
          <span
            className={`grid h-5 w-5 place-items-center rounded-sm border transition-colors duration-150 ${
              inStockOnly ? "border-primary bg-primary" : "border-border"
            }`}
          >
            {inStockOnly && (
              <span className="h-1.5 w-2.5 -translate-y-0.5 rotate-[-45deg] border-b-2 border-l-2 border-primary-foreground" />
            )}
          </span>
          In stock only
        </button>
      </div>

      <button
        type="button"
        onClick={reset}
        className="text-xs text-muted-foreground underline underline-offset-4 transition-colors duration-150 hover:text-primary"
      >
        Reset filters
      </button>
    </div>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-24 text-center">
      <span className="display-xl text-6xl text-primary">00</span>
      <p className="mt-4 max-w-xs text-sm text-muted-foreground">
        Nothing matches those filters. Widen the price range or clear a category.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="eyebrow h-12 rounded-sm bg-primary px-6 text-primary-foreground"
        >
          Reset filters
        </button>
        <Link
          to="/"
          className="eyebrow inline-flex h-12 items-center rounded-sm border border-border px-6"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
