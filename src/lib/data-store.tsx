import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CATEGORY_NAMES, setCatalogue, type Category, type Product } from "@/data/products";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as repo from "@/lib/repo";

/* ------------------------------------------------------------------ types */

export type ProductStatus = "Active" | "Draft" | "Out of Stock";

export type AdminProduct = Product & {
  stock: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  updatedAt: string;
  /** stock per variant label; key "—" when the product has no variants */
  variantStock: Record<string, number>;
};

export type OrderStatus =
  "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";

export type PaymentStatus = "Paid" | "Unpaid" | "Refunded";

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  variant: string | null;
  qty: number;
  price: number;
};

export type OrderEvent = { at: string; label: string };

export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  address: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  payment: PaymentStatus;
  status: OrderStatus;
  tracking: string | null;
  reason: string | null;
  history: OrderEvent[];
};

export type StockAdjustment = {
  id: string;
  productId: string;
  productName: string;
  variant: string;
  delta: number;
  reason: "Restock" | "Damaged" | "Correction";
  at: string;
};

export type ProductInput = {
  name: string;
  description: string;
  category: Category | string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: ProductStatus;
  variants: { label: string; stock: number }[];
  images: string[];
};

export type OrderDraft = Omit<Order, "id" | "createdAt" | "history" | "status" | "payment"> & {
  id?: string;
};

export const DEFAULT_LOW_STOCK_THRESHOLD = 8;
export const NO_VARIANT_KEY = "—";

/** Order status progression used by "advance order". */
const FLOW: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered"];

/** Result of an admin sign-in attempt. */
export type LoginResult = { ok: boolean; error?: string | undefined };

/* ------------------------------------------------------------ sales series */

/**
 * Real revenue per day, derived from actual orders. Days with no orders read
 * zero rather than inventing a number, so the chart reflects the real store.
 */
export function makeSalesSeries(days: number, orders: Order[] = []) {
  const out: { label: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === key && o.status !== "Cancelled",
    );
    out.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    });
  }
  return out;
}

/* -------------------------------------------------------------- persisted */

type Persisted = {
  products: AdminProduct[];
  orders: Order[];
  adjustments: StockAdjustment[];
  categories: string[];
  lowStockThreshold: number;
};

const KEY = "kida.data.v1";
const SESSION_KEY = "kida.admin.session";

/** A brand-new store: no products, no orders, no fake metrics. */
function initial(): Persisted {
  return {
    products: [],
    orders: [],
    adjustments: [],
    categories: [...CATEGORY_NAMES],
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
  };
}

const uid = () => Math.random().toString(36).slice(2, 9);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `item-${uid()}`;

const sumStock = (v: Record<string, number>) => Object.values(v).reduce((a, b) => a + b, 0);

/* --------------------------------------------------------------- provider */

type DataValue = Persisted & {
  ready: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  getProductById: (id: string) => AdminProduct | undefined;
  storefrontProducts: AdminProduct[];
  categories: string[];
  productCountByCategory: Record<string, number>;
  createCategory: (name: string) => boolean;
  renameCategory: (from: string, to: string) => boolean;
  deleteCategory: (name: string, reassignTo?: string) => void;
  setLowStockThreshold: (value: number) => void;

  createProduct: (input: ProductInput) => AdminProduct;
  updateProduct: (id: string, input: ProductInput) => void;
  duplicateProduct: (id: string) => void;
  deleteProducts: (ids: string[]) => void;
  bulkStatus: (ids: string[], status: ProductStatus) => void;
  setVariantStock: (productId: string, variant: string, qty: number) => void;
  adjustStock: (
    productId: string,
    variant: string,
    delta: number,
    reason: StockAdjustment["reason"],
  ) => void;
  placeOrder: (order: OrderDraft) => Order;
  advanceOrder: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus, reason?: string) => void;
  setTracking: (id: string, tracking: string) => void;
};

const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => initial());
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        if (parsed?.products?.length) {
          setState({
            products: parsed.products,
            orders: parsed.orders ?? [],
            adjustments: parsed.adjustments ?? [],
            categories:
              parsed.categories ??
              Array.from(new Set(parsed.products.map((p) => p.category as string))),
            lowStockThreshold: parsed.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
          });
        }
      }
      if (!isSupabaseConfigured) {
        setIsAdmin(localStorage.getItem(SESSION_KEY) === "1");
      }
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  /**
   * Restore an existing Supabase session and confirm the user is on the admin
   * allow-list. Membership is re-checked against the database on every load,
   * so revoking access in Supabase takes effect immediately.
   */
  useEffect(() => {
    if (!supabase) return;

    const verify = async (userId: string | undefined) => {
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase!.from("admins").select("id").eq("id", userId).maybeSingle();
      setIsAdmin(Boolean(data));
    };

    supabase.auth.getSession().then(({ data }) => verify(data.session?.user.id));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void verify(session?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /** Load the live catalogue from Postgres; falls back to local state on error. */
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void repo.fetchProducts().then((rows) => {
      if (rows) setState((prev) => ({ ...prev, products: rows }));
    });
  }, []);

  /** Orders are admin-only under RLS, so refetch whenever admin status changes. */
  useEffect(() => {
    if (!isSupabaseConfigured || !isAdmin) return;
    void repo.fetchOrders().then((rows) => {
      if (rows) setState((prev) => ({ ...prev, orders: rows }));
    });
  }, [isAdmin]);

  /** Keep the non-reactive registry in sync so cart/wishlist can resolve ids. */
  useEffect(() => {
    setCatalogue(state.products);
  }, [state.products]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota — ignore for the prototype */
    }
  }, [state, ready]);

  const patch = useCallback((fn: (prev: Persisted) => Persisted) => setState(fn), []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    // Local fallback for development before Supabase credentials are added.
    if (!supabase) {
      const ok = email.trim().length > 0 && password.length > 0;
      if (ok) {
        localStorage.setItem(SESSION_KEY, "1");
        setIsAdmin(true);
      }
      return { ok, error: ok ? undefined : "Enter an email and password." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Sign in failed." };
    }

    // Authenticated — but only allow-listed users may enter the dashboard.
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      setIsAdmin(false);
      return { ok: false, error: "This account does not have admin access." };
    }

    setIsAdmin(true);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
  }, []);

  const fromInput = useCallback((input: ProductInput, base?: AdminProduct): AdminProduct => {
    const variantStock: Record<string, number> = {};
    if (input.variants.length) {
      for (const v of input.variants) variantStock[v.label] = Math.max(0, v.stock);
    } else {
      variantStock[NO_VARIANT_KEY] = Math.max(0, input.stock);
    }
    const stock = sumStock(variantStock);
    return {
      id: base?.id ?? `${slug(input.name)}-${uid()}`,
      name: input.name,
      category: input.category as Category,
      price: input.price,
      description: input.description,
      images: input.images.length ? input.images : (base?.images ?? []),
      variants: input.variants.map((v) => v.label),
      inStock: stock > 0 && input.status === "Active",
      popularity: base?.popularity ?? 50,
      createdAt: base?.createdAt ?? new Date().toISOString().slice(0, 10),
      ...(base?.tag ? { tag: base.tag } : {}),
      stock,
      compareAtPrice: input.compareAtPrice,
      status: stock === 0 && input.status === "Active" ? "Out of Stock" : input.status,
      updatedAt: new Date().toISOString(),
      variantStock,
    };
  }, []);

  const createProduct = useCallback(
    (input: ProductInput) => {
      const product = fromInput(input);
      // Optimistic insert, then reconcile with the database-generated row.
      patch((prev) => ({ ...prev, products: [product, ...prev.products] }));
      void repo.insertProduct(product).then((saved) => {
        if (saved) {
          patch((prev) => ({
            ...prev,
            products: prev.products.map((p) => (p.id === product.id ? saved : p)),
          }));
        }
      });
      return product;
    },
    [fromInput, patch],
  );

  const updateProduct = useCallback(
    (id: string, input: ProductInput) => {
      let next: AdminProduct | undefined;
      patch((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          if (p.id !== id) return p;
          next = fromInput(input, p);
          return next;
        }),
      }));
      if (next) void repo.updateProductRow(id, next);
    },
    [fromInput, patch],
  );

  const duplicateProduct = useCallback(
    (id: string) => {
      patch((prev) => {
        const src = prev.products.find((p) => p.id === id);
        if (!src) return prev;
        const copy: AdminProduct = {
          ...src,
          id: `${slug(src.name)}-copy-${uid()}`,
          name: `${src.name} (Copy)`,
          status: "Draft",
          updatedAt: new Date().toISOString(),
        };
        const idx = prev.products.findIndex((p) => p.id === id);
        const next = [...prev.products];
        next.splice(idx + 1, 0, copy);
        return { ...prev, products: next };
      });
    },
    [patch],
  );

  const deleteProducts = useCallback(
    (ids: string[]) => {
      patch((prev) => ({ ...prev, products: prev.products.filter((p) => !ids.includes(p.id)) }));
      void repo.deleteProductRows(ids);
    },
    [patch],
  );

  const bulkStatus = useCallback(
    (ids: string[], status: ProductStatus) =>
      patch((prev) => {
        const products = prev.products.map((p) =>
          ids.includes(p.id)
            ? {
                ...p,
                status,
                inStock: status === "Active" && p.stock > 0,
                updatedAt: new Date().toISOString(),
              }
            : p,
        );
        for (const p of products) {
          if (ids.includes(p.id)) void repo.updateProductRow(p.id, p);
        }
        return { ...prev, products };
      }),
    [patch],
  );

  const createCategory = useCallback((name: string) => {
    const clean = name.trim();
    let ok = false;
    setState((prev) => {
      if (!clean || prev.categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      ok = true;
      return { ...prev, categories: [...prev.categories, clean] };
    });
    return ok;
  }, []);

  const renameCategory = useCallback((from: string, to: string) => {
    const clean = to.trim();
    let ok = false;
    setState((prev) => {
      if (
        !clean ||
        prev.categories.some((c) => c.toLowerCase() === clean.toLowerCase() && c !== from)
      ) {
        return prev;
      }
      ok = true;
      return {
        ...prev,
        categories: prev.categories.map((c) => (c === from ? clean : c)),
        products: prev.products.map((p) =>
          p.category === from ? { ...p, category: clean as Category } : p,
        ),
      };
    });
    return ok;
  }, []);

  const deleteCategory = useCallback(
    (name: string, reassignTo?: string) =>
      patch((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c !== name),
        products: reassignTo
          ? prev.products.map((p) =>
              p.category === name ? { ...p, category: reassignTo as Category } : p,
            )
          : prev.products.filter((p) => p.category !== name),
      })),
    [patch],
  );

  const setLowStockThreshold = useCallback(
    (value: number) =>
      patch((prev) => ({
        ...prev,
        lowStockThreshold: Math.max(1, Math.min(999, Math.round(value) || 1)),
      })),
    [patch],
  );

  const setVariantStock = useCallback(
    (productId: string, variant: string, qty: number) =>
      patch((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          if (p.id !== productId) return p;
          const variantStock = { ...p.variantStock, [variant]: Math.max(0, qty) };
          const stock = sumStock(variantStock);
          const next: AdminProduct = {
            ...p,
            variantStock,
            stock,
            status: stock === 0 && p.status === "Active" ? "Out of Stock" : p.status,
            inStock: stock > 0 && p.status !== "Draft",
            updatedAt: new Date().toISOString(),
          };
          void repo.updateProductRow(productId, next);
          return next;
        }),
      })),
    [patch],
  );

  const adjustStock = useCallback(
    (productId: string, variant: string, delta: number, reason: StockAdjustment["reason"]) =>
      patch((prev) => {
        const product = prev.products.find((p) => p.id === productId);
        if (!product) return prev;
        const current = product.variantStock[variant] ?? 0;
        const variantStock = { ...product.variantStock, [variant]: Math.max(0, current + delta) };
        const stock = sumStock(variantStock);
        return {
          ...prev,
          products: prev.products.map((p) => {
            if (p.id !== productId) return p;
            const next: AdminProduct = {
              ...p,
              variantStock,
              stock,
              inStock: stock > 0 && p.status !== "Draft",
              status: stock === 0 && p.status === "Active" ? "Out of Stock" : p.status,
              updatedAt: new Date().toISOString(),
            };
            void repo.updateProductRow(productId, next);
            return next;
          }),
          adjustments: [
            {
              id: uid(),
              productId,
              productName: product.name,
              variant,
              delta,
              reason,
              at: new Date().toISOString(),
            },
            ...prev.adjustments,
          ].slice(0, 60),
        };
      }),
    [patch],
  );

  const placeOrder = useCallback(
    (draft: OrderDraft) => {
      const now = new Date().toISOString();
      const order: Order = {
        ...draft,
        id: draft.id ?? `KG-${Math.floor(2500 + Math.random() * 400)}`,
        createdAt: now,
        status: "Pending",
        payment: "Paid",
        history: [{ at: now, label: "Order placed from storefront" }],
      } as Order;
      patch((prev) => ({ ...prev, orders: [order, ...prev.orders] }));
      // Persist so the order shows up in the dashboard on any device.
      void repo.insertOrder(order).then((saved) => {
        if (saved) {
          patch((prev) => ({
            ...prev,
            orders: prev.orders.map((o) => (o.id === order.id ? saved : o)),
          }));
        }
      });
      return order;
    },
    [patch],
  );

  const pushHistory = (order: Order, label: string): Order => ({
    ...order,
    history: [...order.history, { at: new Date().toISOString(), label }],
  });

  const advanceOrder = useCallback(
    (id: string) =>
      patch((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => {
          if (o.id !== id) return o;
          const idx = FLOW.indexOf(o.status);
          if (idx < 0 || idx === FLOW.length - 1) return o;
          const next = FLOW[idx + 1]!;
          return pushHistory({ ...o, status: next }, `Status advanced to ${next}`);
        }),
      })),
    [patch],
  );

  const setOrderStatus = useCallback(
    (id: string, status: OrderStatus, reason?: string) => {
      void repo.updateOrderRow(id, {
        status,
        ...(status === "Refunded" ? { payment: "Refunded" as const } : {}),
        ...(reason ? { note: reason } : {}),
      });
      return patch((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === id
            ? pushHistory(
                {
                  ...o,
                  status,
                  reason: reason ?? o.reason,
                  payment: status === "Refunded" ? "Refunded" : o.payment,
                },
                `Marked ${status}${reason ? ` — ${reason}` : ""}`,
              )
            : o,
        ),
      }));
    },
    [patch],
  );

  const setTracking = useCallback(
    (id: string, tracking: string) => {
      void repo.updateOrderRow(id, { tracking });
      return patch((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === id ? pushHistory({ ...o, tracking }, `Tracking added: ${tracking}`) : o,
        ),
      }));
    },
    [patch],
  );

  const value = useMemo<DataValue>(() => {
    const categories = Array.from(
      new Set([...state.categories, ...state.products.map((p) => p.category as string)]),
    );
    const productCountByCategory: Record<string, number> = {};
    for (const c of categories) productCountByCategory[c] = 0;
    for (const p of state.products) {
      productCountByCategory[p.category] = (productCountByCategory[p.category] ?? 0) + 1;
    }
    return {
      ...state,
      ready,
      isAdmin,
      login,
      logout,
      categories,
      productCountByCategory,
      createCategory,
      renameCategory,
      deleteCategory,
      setLowStockThreshold,
      storefrontProducts: state.products.filter((p) => p.status !== "Draft"),
      getProductById: (id: string) => state.products.find((p) => p.id === id),
      createProduct,
      updateProduct,
      duplicateProduct,
      deleteProducts,
      bulkStatus,
      setVariantStock,
      adjustStock,
      placeOrder,
      advanceOrder,
      setOrderStatus,
      setTracking,
    };
  }, [
    state,
    ready,
    isAdmin,
    login,
    logout,
    createProduct,
    createCategory,
    renameCategory,
    deleteCategory,
    setLowStockThreshold,
    updateProduct,
    duplicateProduct,
    deleteProducts,
    bulkStatus,
    setVariantStock,
    adjustStock,
    placeOrder,
    advanceOrder,
    setOrderStatus,
    setTracking,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

/* ------------------------------------------------------------- selectors */

export function useCustomers() {
  const { orders } = useData();
  return useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string; orders: Order[]; spent: number; last: string }
    >();
    for (const o of orders) {
      const entry = map.get(o.customerEmail) ?? {
        name: o.customerName,
        email: o.customerEmail,
        orders: [],
        spent: 0,
        last: o.createdAt,
      };
      entry.orders.push(o);
      if (o.status !== "Cancelled" && o.status !== "Refunded") entry.spent += o.total;
      if (o.createdAt > entry.last) entry.last = o.createdAt;
      map.set(o.customerEmail, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [orders]);
}
