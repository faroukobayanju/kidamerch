import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/data/products";
import { useData } from "@/lib/data-store";
import { useStore } from "@/lib/store";
import { QtyStepper } from "@/components/QtyStepper";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/icons";
import { buildProductMessage, openWhatsApp } from "@/lib/whatsapp";
import { EASE, Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — KIDA" },
      {
        name: "description",
        content: "Independent anime merch in small runs. Order and confirm on WhatsApp.",
      },
    ],
  }),
  notFoundComponent: ProductMissing,
  component: ProductDetail,
});

function ProductMissing() {
  return (
    <div className="mx-auto max-w-md px-5 py-32 text-center">
      <h1 className="display-xl text-4xl">Piece not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This item may have sold through or been archived.
      </p>
      <Link
        to="/shop"
        className="eyebrow mt-8 inline-flex h-14 items-center rounded-sm bg-primary px-7 text-primary-foreground"
      >
        Back to shop
      </Link>
    </div>
  );
}

function ProductDetail() {
  const { id } = Route.useParams();
  // Resolved from the live catalogue, which loads asynchronously from Supabase.
  const { getProductById, storefrontProducts, ready } = useData();
  const product = getProductById(id);

  const { addToCart, isWished, toggleWishlist } = useStore();
  const [imgIndex, setImgIndex] = useState(0);
  const [variant, setVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    // Still hydrating the catalogue — avoid flashing "not found" on refresh.
    if (!ready || storefrontProducts.length === 0) {
      return <div className="min-h-[60svh]" />;
    }
    return <ProductMissing />;
  }

  const activeVariant = variant ?? product.variants[0] ?? null;

  const related = storefrontProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const wished = isWished(product.id);

  const handleAdd = () => {
    addToCart(product, activeVariant, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
      <Link
        to="/shop"
        className="eyebrow inline-flex items-center gap-2 text-[10px] text-muted-foreground transition-colors duration-150 hover:text-primary"
      >
        <ArrowLeft size={13} /> All items
      </Link>

      <div className="grid gap-10 pt-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-border bg-surface-2">
            <AnimatePresence mode="wait">
              <motion.img
                key={imgIndex}
                src={product.images[imgIndex]}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {product.images.map((img: string, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => setImgIndex(i)}
                aria-label={`View image ${i + 1}`}
                className={`h-20 w-16 shrink-0 overflow-hidden rounded-sm border transition-colors duration-200 ${
                  i === imgIndex ? "border-primary" : "border-border"
                }`}
              >
                <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:pt-4">
          <p className="eyebrow text-primary">{product.category}</p>
          <h1 className="display-xl mt-4 text-4xl sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-semibold tabular-nums text-primary">
            {formatPrice(product.price)}
          </p>
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {product.variants.length > 0 && (
            <div className="mt-9">
              <p className="eyebrow text-[10px] text-muted-foreground">Select size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((v: string) => {
                  const active = v === activeVariant;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVariant(v)}
                      aria-pressed={active}
                      className={`relative h-12 min-w-14 rounded-sm border px-4 text-sm font-semibold transition-colors duration-200 ${
                        active
                          ? "border-primary text-primary-foreground"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="variant-pill"
                          className="absolute inset-0 rounded-sm bg-primary"
                          transition={{ duration: 0.28, ease: EASE }}
                        />
                      )}
                      <span className="relative">{v}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <QtyStepper qty={qty} onChange={(n) => setQty(Math.max(1, n))} />
            <button
              type="button"
              disabled={!product.inStock}
              onClick={handleAdd}
              className="eyebrow relative inline-flex h-14 min-w-[190px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-sm bg-primary text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
            >
              <AnimatePresence mode="wait" initial={false}>
                {added ? (
                  <motion.span
                    key="added"
                    className="inline-flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <Check size={16} /> Added
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    className="inline-flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <ShoppingBag size={16} />
                    {product.inStock ? "Add to cart" : "Sold out"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => openWhatsApp(buildProductMessage(product, activeVariant, qty))}
              className="eyebrow inline-flex h-14 items-center gap-2 rounded-sm border border-primary px-5 text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
            >
              <WhatsAppIcon size={16} /> Order on WhatsApp
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={wished}
              className="eyebrow inline-flex h-14 items-center gap-2 rounded-sm border border-border px-5 transition-colors duration-200 hover:bg-secondary"
            >
              <Heart
                size={16}
                className={wished ? "text-primary" : ""}
                fill={wished ? "currentColor" : "none"}
              />
              {wished ? "Saved" : "Wishlist"}
            </button>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-6 rule-line pt-6 text-xs">
            <div>
              <dt className="text-muted-foreground">Availability</dt>
              <dd className="mt-1 font-semibold">{product.inStock ? "In stock" : "Sold out"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="mt-1 font-semibold">Quoted on WhatsApp</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-24">
          <Reveal>
            <h2 className="display-xl pb-8 text-3xl sm:text-4xl">More in {product.category}</h2>
          </Reveal>
          <div className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {related.map((p) => (
              <div key={p.id} className="w-[70vw] shrink-0 sm:w-[42vw] lg:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
