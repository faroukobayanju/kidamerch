import { supabase } from "@/lib/supabase";
import {
  NO_VARIANT_KEY,
  type AdminProduct,
  type Order,
  type ProductStatus,
} from "@/lib/data-store";
import type { Category } from "@/data/products";

/**
 * Data access layer between the app's in-memory shapes and Postgres.
 * Every function is a no-op returning null when Supabase is unconfigured, so
 * the app still runs on localStorage during local development.
 */

type ProductRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string | number;
  compare_at_price: string | number | null;
  images: string[];
  variants: { label: string; stock: number }[];
  stock: number;
  status: ProductStatus;
  popularity: number;
  created_at: string;
  updated_at: string;
};

const num = (v: string | number | null | undefined) => (v == null ? 0 : Number(v));

/**
 * Postgres refuses writes from anyone who is not in `public.admins`. That is the
 * single most common reason a save appears to work but never persists, so it is
 * worth translating into something a shop owner can act on.
 */
const RLS_VIOLATION = "42501";

export function describeWriteError(error: { code?: string; message: string }): string {
  if (error.code === RLS_VIOLATION) {
    return "Your account is not on the admin allow-list, so the database rejected the save. Add your user id to the admins table.";
  }
  return error.message;
}

/** Postgres row → the shape the UI already understands. */
function toProduct(row: ProductRow): AdminProduct {
  const variants = Array.isArray(row.variants) ? row.variants : [];
  const variantStock: Record<string, number> = {};
  if (variants.length) {
    for (const v of variants) variantStock[v.label] = v.stock;
  } else {
    variantStock[NO_VARIANT_KEY] = row.stock;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Category,
    price: num(row.price),
    images: row.images ?? [],
    variants: variants.map((v) => v.label),
    inStock: row.stock > 0 && row.status === "Active",
    popularity: row.popularity,
    createdAt: row.created_at,
    stock: row.stock,
    compareAtPrice: row.compare_at_price == null ? null : num(row.compare_at_price),
    status: row.status,
    updatedAt: row.updated_at,
    variantStock,
  };
}

/** The UI shape → columns, dropping fields Postgres owns (id, timestamps). */
function toRow(p: AdminProduct) {
  const variants = Object.entries(p.variantStock)
    .filter(([label]) => label !== NO_VARIANT_KEY)
    .map(([label, stock]) => ({ label, stock }));

  return {
    name: p.name,
    description: p.description,
    category: p.category as string,
    price: p.price,
    compare_at_price: p.compareAtPrice,
    images: p.images,
    variants,
    stock: p.stock,
    status: p.status,
    popularity: p.popularity,
  };
}

/* -------------------------------------------------------------- products */

/** Everything the current viewer is allowed to see (RLS filters drafts out). */
export async function fetchProducts(): Promise<AdminProduct[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[repo] fetchProducts", error.message);
    return null;
  }
  return (data as ProductRow[]).map(toProduct);
}

export type WriteResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Supabase is not configured — the caller should stay on local state. */
const OFFLINE = { ok: false, error: "" } as const;

export async function insertProduct(p: AdminProduct): Promise<WriteResult<AdminProduct>> {
  if (!supabase) return OFFLINE;
  const { data, error } = await supabase.from("products").insert(toRow(p)).select().single();
  if (error) {
    console.error("[repo] insertProduct", error.message);
    return { ok: false, error: describeWriteError(error) };
  }
  return { ok: true, data: toProduct(data as ProductRow) };
}

export async function updateProductRow(id: string, p: AdminProduct): Promise<WriteResult<true>> {
  if (!supabase) return OFFLINE;
  const { error } = await supabase.from("products").update(toRow(p)).eq("id", id);
  if (error) {
    console.error("[repo] updateProductRow", error.message);
    return { ok: false, error: describeWriteError(error) };
  }
  return { ok: true, data: true };
}

export async function deleteProductRows(ids: string[]): Promise<WriteResult<true>> {
  if (!supabase || ids.length === 0) return OFFLINE;
  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) {
    console.error("[repo] deleteProductRows", error.message);
    return { ok: false, error: describeWriteError(error) };
  }
  return { ok: true, data: true };
}

/* --------------------------------------------------------------- storage */

/**
 * Uploads a product photo to the public `product-images` bucket and returns its
 * permanent URL. Only admins may write, enforced by storage RLS policies.
 * Returns null when Supabase is unconfigured or the upload fails.
 */
export async function uploadProductImage(file: File): Promise<string | null> {
  if (!supabase) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (error) {
    console.error("[repo] uploadProductImage", error.message);
    return null;
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------------------------------------------------------- orders */

type OrderRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  items: Order["items"];
  subtotal: string | number;
  shipping: string | number;
  total: string | number;
  status: Order["status"];
  payment: Order["payment"];
  tracking: string | null;
  note: string | null;
  created_at: string;
};

function toOrder(row: OrderRow): Order {
  return {
    id: row.reference || row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email || row.customer_phone,
    address: row.address,
    createdAt: row.created_at,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: num(row.subtotal),
    shipping: num(row.shipping),
    tax: 0,
    total: num(row.total),
    payment: row.payment,
    status: row.status,
    tracking: row.tracking,
    reason: row.note,
    history: [{ at: row.created_at, label: "Order placed" }],
  };
}

/** Admin-only: RLS blocks this for anonymous visitors. */
export async function fetchOrders(): Promise<Order[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[repo] fetchOrders", error.message);
    return null;
  }
  return (data as OrderRow[]).map(toOrder);
}

export async function insertOrder(o: Order, phone = ""): Promise<Order | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: o.customerName,
      customer_email: o.customerEmail,
      customer_phone: phone,
      address: o.address,
      items: o.items,
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
      status: "Pending",
      payment: "Unpaid",
    })
    .select()
    .single();
  if (error) {
    console.error("[repo] insertOrder", error.message);
    return null;
  }
  return toOrder(data as OrderRow);
}

export async function updateOrderRow(
  reference: string,
  patch: Partial<{
    status: Order["status"];
    payment: Order["payment"];
    tracking: string | null;
    note: string | null;
  }>,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("orders").update(patch).eq("reference", reference);
  if (error) console.error("[repo] updateOrderRow", error.message);
  return !error;
}
