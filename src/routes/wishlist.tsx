import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { formatPrice } from "@/data/products";
import { useData } from "@/lib/data-store";
import { useStore } from "@/lib/store";
import { EASE } from "@/components/Reveal";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — KIDA" },
      {
        name: "description",
        content:
          "Your saved KIDA pieces. Move items straight to the bag or keep them held for the next drop.",
      },
      { property: "og:title", content: "Wishlist — KIDA" },
      {
        property: "og:description",
        content: "Your saved KIDA pieces, ready to move to the bag.",
      },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const { getProductById } = useData();
  // Resolved against the live catalogue so saved items survive a reload.
  const items = wishlist.map((id) => getProductById(id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
      <header className="pb-10">
        <p className="eyebrow text-primary">Saved</p>
        <h1 className="display-xl mt-3 text-5xl sm:text-6xl">Wishlist</h1>
        <p className="mt-4 text-sm text-muted-foreground tabular-nums">
          {items.length} {items.length === 1 ? "piece" : "pieces"} held
        </p>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-border">
            <Heart size={22} className="text-primary" />
          </span>
          <h2 className="display-xl mt-6 text-2xl">Nothing saved yet</h2>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Tap the heart on any piece to hold it here while you think it over.
          </p>
          <Link
            to="/shop"
            className="eyebrow mt-8 inline-flex h-14 items-center rounded-sm bg-primary px-7 text-primary-foreground"
          >
            Browse the drop
          </Link>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {items.map((p) => (
              <motion.article
                key={p!.id}
                layout
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="overflow-hidden rounded-sm border border-border bg-card"
              >
                <Link to="/product/$id" params={{ id: p!.id }} className="block">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={p!.images[0]}
                      alt={p!.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="p-5">
                  <p className="eyebrow text-[10px] text-muted-foreground">{p!.category}</p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <h2 className="min-w-0 truncate text-base font-semibold">{p!.name}</h2>
                    <p className="shrink-0 font-semibold text-primary tabular-nums">
                      {formatPrice(p!.price)}
                    </p>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      disabled={!p!.inStock}
                      onClick={() => {
                        addToCart(p!, p!.variants[0] ?? null);
                        toggleWishlist(p!);
                      }}
                      className="eyebrow h-12 flex-1 rounded-sm bg-primary text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:bg-secondary disabled:text-muted-foreground"
                    >
                      {p!.inStock ? "Move to cart" : "Sold out"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p!)}
                      className="eyebrow h-12 rounded-sm border border-border px-4 text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
