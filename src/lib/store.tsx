import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { getProduct, type Product } from "@/data/products";

export type CartLine = { id: string; variant: string | null; qty: number };

type StoreValue = {
  cart: CartLine[];
  wishlist: string[];
  cartCount: number;
  subtotal: number;
  /** Same as subtotal — shipping is quoted per location over WhatsApp. */
  total: number;
  lines: { line: CartLine; product: Product }[];
  addToCart: (product: Product, variant?: string | null, qty?: number) => void;
  setQty: (id: string, variant: string | null, qty: number) => void;
  removeLine: (id: string, variant: string | null) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isWished: (id: string) => boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  bump: number;
};

const StoreContext = createContext<StoreValue | null>(null);

const CART_KEY = "kida.cart";
const WISH_KEY = "kida.wishlist";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const w = localStorage.getItem(WISH_KEY);
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const addToCart = useCallback((product: Product, variant: string | null = null, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === product.id && l.variant === variant);
      if (existing) {
        return prev.map((l) =>
          l.id === product.id && l.variant === variant ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { id: product.id, variant, qty }];
    });
    setBump((b) => b + 1);
    toast.success("Added to cart", {
      description: `${product.name}${variant ? ` · ${variant}` : ""}`,
    });
  }, []);

  const setQty = useCallback((id: string, variant: string | null, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => !(l.id === id && l.variant === variant))
        : prev.map((l) => (l.id === id && l.variant === variant ? { ...l, qty } : l)),
    );
  }, []);

  const removeLine = useCallback((id: string, variant: string | null) => {
    setCart((prev) => prev.filter((l) => !(l.id === id && l.variant === variant)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      if (prev.includes(product.id)) {
        toast("Removed from wishlist", { description: product.name });
        return prev.filter((x) => x !== product.id);
      }
      toast.success("Added to wishlist", { description: product.name });
      return [...prev, product.id];
    });
  }, []);

  const isWished = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const value = useMemo<StoreValue>(() => {
    const lines = cart
      .map((line) => {
        const product = getProduct(line.id);
        return product ? { line, product } : null;
      })
      .filter(Boolean) as { line: CartLine; product: Product }[];

    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.line.qty, 0);

    return {
      cart,
      wishlist,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      lines,
      subtotal,
      total: subtotal,
      addToCart,
      setQty,
      removeLine,
      clearCart,
      toggleWishlist,
      isWished,
      cartOpen,
      setCartOpen,
      bump,
    };
  }, [
    cart,
    wishlist,
    addToCart,
    setQty,
    removeLine,
    clearCart,
    toggleWishlist,
    isWished,
    cartOpen,
    bump,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
