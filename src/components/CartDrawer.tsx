import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/data/products";
import { QtyStepper } from "./QtyStepper";
import { AnimatedNumber } from "./AnimatedNumber";
import { WhatsAppIcon } from "./icons";
import { buildOrderMessage, openWhatsApp } from "@/lib/whatsapp";
import { EASE } from "./Reveal";

export function CartDrawer() {
  const { cartOpen, setCartOpen, lines, setQty, removeLine, subtotal, total } = useStore();

  const orderOnWhatsApp = () => {
    openWhatsApp(buildOrderMessage({ lines, totals: { subtotal, total } }));
    setCartOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[85] bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Cart"
            className="fixed inset-y-0 right-0 z-[90] flex w-full flex-col bg-background sm:w-[420px] lg:w-[460px] sm:border-l sm:border-border"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-5">
              <p className="display-xl text-xl">Your bag</p>
              <button
                type="button"
                aria-label="Close cart"
                onClick={() => setCartOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-border"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <ShoppingBag size={28} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nothing in the bag yet.</p>
                  <Link
                    to="/shop"
                    onClick={() => setCartOpen(false)}
                    className="eyebrow rounded-sm bg-primary px-6 py-3.5 text-primary-foreground"
                  >
                    Shop the collection
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {lines.map(({ line, product }) => (
                      <motion.li
                        key={`${line.id}-${line.variant ?? "one"}`}
                        layout
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="flex gap-4 overflow-hidden py-5"
                      >
                        <img
                          src={product.images[0]}
                          alt=""
                          loading="lazy"
                          className="h-24 w-20 shrink-0 rounded-sm object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{product.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {product.category}
                            {line.variant ? ` · ${line.variant}` : ""}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <QtyStepper
                              compact
                              qty={line.qty}
                              onChange={(n) => setQty(line.id, line.variant, n)}
                            />
                            <button
                              type="button"
                              aria-label="Remove item"
                              onClick={() => removeLine(line.id, line.variant)}
                              className="grid h-9 w-9 place-items-center text-muted-foreground transition-colors duration-150 hover:text-primary"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatPrice(product.price * line.qty)}
                        </p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="shrink-0 border-t border-border px-5 py-5">
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="eyebrow">Total</span>
                  <AnimatedNumber
                    value={total}
                    format={formatPrice}
                    className="text-lg font-semibold tabular-nums text-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={orderOnWhatsApp}
                  className="eyebrow mt-5 flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-4 text-center text-primary-foreground transition-opacity duration-200 hover:opacity-90"
                >
                  <WhatsAppIcon size={16} /> Order on WhatsApp
                </button>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="eyebrow mt-3 block rounded-sm border border-border py-4 text-center transition-colors duration-200 hover:bg-secondary"
                >
                  Add delivery details
                </Link>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                  Delivery is quoted on WhatsApp — it varies by location.
                </p>
                <Link
                  to="/cart"
                  onClick={() => setCartOpen(false)}
                  className="mt-3 block py-2 text-center text-xs text-muted-foreground underline underline-offset-4"
                >
                  View full bag
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
