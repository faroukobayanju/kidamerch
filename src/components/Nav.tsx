import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "./theme";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/data/products";
import { useData } from "@/lib/data-store";
import { EASE } from "./Reveal";

const LINKS = [
  { label: "Shop", to: "/shop" },
  { label: "Wishlist", to: "/wishlist" },
] as const;

export function Nav() {
  const { cartCount, setCartOpen, bump, wishlist } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled ? "glass-bar border-b border-border" : "border-b border-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center gap-4 px-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-8 ${
            scrolled ? "h-16" : "h-24"
          }`}
        >
          <Link to="/" aria-label="KIDA — home" className="mr-auto flex min-w-0 items-center">
            <Logo
              className={`w-auto transition-all duration-300 ${scrolled ? "h-12" : "h-[68px]"}`}
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="eyebrow text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
                activeProps={{ className: "eyebrow text-[11px] text-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Search products"
              onClick={() => setSearchOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors duration-200 hover:bg-secondary"
            >
              <Search size={17} />
            </button>

            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative hidden h-11 w-11 place-items-center rounded-full border border-border transition-colors duration-200 hover:bg-secondary sm:grid"
            >
              <Heart size={17} />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <ThemeToggle />

            <motion.button
              type="button"
              aria-label={`Open cart, ${cartCount} items`}
              onClick={() => setCartOpen(true)}
              className="relative grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"
              key={bump}
              {...(reduce ? {} : { initial: { scale: 1 }, animate: { scale: [1, 1.16, 1] } })}
              transition={{ duration: 0.34, ease: EASE }}
            >
              <ShoppingBag size={17} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-background bg-foreground px-1 text-[10px] font-bold text-background">
                  {cartCount}
                </span>
              )}
            </motion.button>

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-full border border-border transition-colors duration-200 hover:bg-secondary lg:hidden"
            >
              <Menu size={17} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] bg-background lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <div className="flex h-24 items-center justify-between px-5">
            <Logo className="h-16 w-auto" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full border border-border"
            >
              <X size={18} />
            </button>
          </div>
          <motion.nav
            className="flex flex-col px-5 pt-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
            }}
          >
            {[{ label: "Home", to: "/" }, ...LINKS, { label: "Cart", to: "/cart" }].map((l) => (
              <motion.div
                key={l.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
                }}
              >
                <Link
                  to={l.to as never}
                  onClick={onClose}
                  className="display-xl block border-b border-border py-5 text-4xl"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { storefrontProducts } = useData();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return storefrontProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [q, storefrontProducts]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mx-auto max-w-2xl px-5 pt-20 sm:pt-28">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Search size={20} className="shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search hoodies, figures, prints…"
                className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={onClose}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-1">
              {q && results.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nothing matches “{q}”. Try a category instead.
                </p>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate({ to: "/product/$id", params: { id: p.id } });
                  }}
                  className="flex w-full items-center gap-4 rounded-sm p-2 text-left transition-colors duration-150 hover:bg-secondary"
                >
                  <img
                    src={p.images[0]}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-sm object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.category}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-primary">
                    {formatPrice(p.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
