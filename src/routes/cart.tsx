import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice } from "@/data/products";
import { useStore } from "@/lib/store";
import { QtyStepper } from "@/components/QtyStepper";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { WhatsAppIcon } from "@/components/icons";
import { buildOrderMessage, openWhatsApp } from "@/lib/whatsapp";
import { EASE } from "@/components/Reveal";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — KIDA" },
      {
        name: "description",
        content:
          "Review your KIDA bag: line items, variants and quantities, then send the order straight to WhatsApp.",
      },
      { property: "og:title", content: "Your Bag — KIDA" },
      { property: "og:description", content: "Review your bag before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, removeLine, subtotal, total, cartCount } = useStore();

  const orderOnWhatsApp = () =>
    openWhatsApp(buildOrderMessage({ lines, totals: { subtotal, total } }));

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
      <header className="pb-10">
        <p className="eyebrow text-primary">Order on WhatsApp</p>
        <h1 className="display-xl mt-3 text-5xl sm:text-6xl">Your bag</h1>
        <p className="mt-4 text-sm text-muted-foreground tabular-nums">
          {cartCount} {cartCount === 1 ? "item" : "items"}
        </p>
      </header>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-border">
            <ShoppingBag size={22} className="text-primary" />
          </span>
          <h2 className="display-xl mt-6 text-2xl">Your bag is empty</h2>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Start with the new arrivals — we confirm every order on WhatsApp.
          </p>
          <Link
            to="/shop"
            className="eyebrow mt-8 inline-flex h-14 items-center rounded-sm bg-primary px-7 text-primary-foreground"
          >
            Shop the collection
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <ul className="divide-y divide-border rule-line">
            <AnimatePresence initial={false}>
              {lines.map(({ line, product }) => (
                <motion.li
                  key={`${line.id}-${line.variant ?? "one"}`}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 overflow-hidden py-6 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:gap-6"
                >
                  <Link
                    to="/product/$id"
                    params={{ id: product.id }}
                    className="block overflow-hidden rounded-sm"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to="/product/$id"
                      params={{ id: product.id }}
                      className="block truncate font-semibold"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.category}
                      {line.variant ? ` · ${line.variant}` : ""}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-primary tabular-nums sm:hidden">
                      {formatPrice(product.price * line.qty)}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <QtyStepper
                        compact
                        qty={line.qty}
                        onChange={(n) => setQty(line.id, line.variant, n)}
                      />
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => removeLine(line.id, line.variant)}
                        className="grid h-11 w-11 place-items-center text-muted-foreground transition-colors duration-150 hover:text-primary"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="hidden shrink-0 font-semibold tabular-nums sm:block">
                    {formatPrice(product.price * line.qty)}
                  </p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border border-border bg-surface p-6">
              <p className="eyebrow text-[10px] text-muted-foreground">Order summary</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                <span className="eyebrow">Total</span>
                <AnimatedNumber
                  value={total}
                  format={formatPrice}
                  className="text-xl font-semibold tabular-nums text-primary"
                />
              </div>
              <button
                type="button"
                onClick={orderOnWhatsApp}
                className="eyebrow mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-4 text-center text-primary-foreground transition-opacity duration-200 hover:opacity-90"
              >
                <WhatsAppIcon size={16} /> Order on WhatsApp
              </button>
              <Link
                to="/checkout"
                className="eyebrow mt-3 block rounded-sm border border-border py-4 text-center transition-colors duration-200 hover:bg-secondary"
              >
                Add delivery details
              </Link>
              <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
                Delivery is not included. We share the cost on WhatsApp once we know your location.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
