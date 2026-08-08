import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Copy, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  Panel,
  SlideOver,
  StatusBadge,
  TableSkeleton,
  btnGhost,
  btnPrimary,
  btnSubtle,
  inputCls,
} from "@/components/admin/parts";
import { EASE } from "@/components/Reveal";
import { formatPrice } from "@/data/products";
import {
  useData,
  type AdminProduct,
  type ProductInput,
  type ProductStatus,
} from "@/lib/data-store";
import { uploadProductImage } from "@/lib/repo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

const PER_PAGE = 8;
const STATUSES: ProductStatus[] = ["Active", "Draft", "Out of Stock"];

type FormState = {
  name: string;
  category: string;
  price: string;
  compareAtPrice: string;
  description: string;
  status: ProductStatus;
  stock: string;
  variants: { label: string; stock: string }[];
  images: string[];
};

const emptyForm = (category: string): FormState => ({
  name: "",
  category,
  price: "",
  compareAtPrice: "",
  description: "",
  status: "Draft",
  stock: "0",
  variants: [],
  images: [],
});

const toForm = (p: AdminProduct): FormState => ({
  name: p.name,
  category: p.category,
  price: String(p.price),
  compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
  description: p.description,
  status: p.status,
  stock: String(p.stock),
  variants: p.variants.map((v) => ({ label: v, stock: String(p.variantStock[v] ?? 0) })),
  images: [...p.images],
});

function ProductsPage() {
  const {
    products,
    categories,
    ready,
    createProduct,
    updateProduct,
    duplicateProduct,
    deleteProducts,
    bulkStatus,
    lowStockThreshold,
  } = useData();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(categories[0] ?? "Apparel"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Uploads picked photos to Supabase Storage and appends their public URLs.
   * Without Supabase there is nowhere to host them, so we say so rather than
   * silently doing nothing.
   */
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!isSupabaseConfigured) {
      toast.error("Image upload needs Supabase", {
        description: "Add your credentials to .env, or paste an image URL instead.",
      });
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    let failed = 0;

    for (const file of Array.from(files)) {
      const url = await uploadProductImage(file);
      if (url) uploaded.push(url);
      else failed++;
    }

    if (uploaded.length) {
      // Drop any blank URL rows so uploads don't leave empty inputs behind.
      setForm((prev) => ({
        ...prev,
        images: [...prev.images.filter((u) => u.trim()), ...uploaded],
      }));
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`);
    }
    if (failed) {
      toast.error(`${failed} image${failed === 1 ? "" : "s"} failed to upload`, {
        description: "Check you are signed in as an admin, then try again.",
      });
    }
    setUploading(false);
  };

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        (category === "all" || p.category === category) &&
        (status === "all" || p.status === status),
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "stock") sorted.sort((a, b) => a.stock - b.stock);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "updated") sorted.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return sorted;
  }, [products, query, category, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(categories[0] ?? "Apparel"));
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm(toForm(p));
    setErrors({});
    setFormOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next["name"] = "Name is required.";
    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price <= 0) next["price"] = "Enter a price above 0.";
    if (form.compareAtPrice && Number(form.compareAtPrice) <= price)
      next["compareAtPrice"] = "Compare-at must exceed the price.";
    if (!form.description.trim() || form.description.trim().length < 10)
      next["description"] = "Add at least 10 characters.";
    if (form.variants.length === 0 && Number(form.stock) < 0)
      next["stock"] = "Stock cannot be negative.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const input: ProductInput = {
      name: form.name.trim(),
      category: form.category,
      price,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      description: form.description.trim(),
      status: form.status,
      stock: Number(form.stock) || 0,
      variants: form.variants
        .filter((v) => v.label.trim())
        .map((v) => ({ label: v.label.trim(), stock: Number(v.stock) || 0 })),
      images: form.images.map((u) => u.trim()).filter(Boolean),
    };

    if (editing) {
      updateProduct(editing.id, input);
      toast.success("Product updated", { description: input.name });
    } else {
      createProduct(input);
      toast.success("Product created", { description: `${input.name} is live in the store` });
    }
    setFormOpen(false);
  };

  return (
    <AdminShell
      title="Products"
      description="Create, edit and organise the catalogue. Anything marked Active appears in the storefront immediately."
      actions={
        <button type="button" onClick={openCreate} className={btnPrimary}>
          <PackagePlus size={15} /> New product
        </button>
      }
    >
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search products"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option value="updated">Recently updated</option>
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price low–high</option>
            <option value="price-desc">Price high–low</option>
            <option value="stock">Lowest stock</option>
          </select>
        </div>

        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5"
          >
            <span className="text-xs font-semibold">{selected.length} selected</span>
            <button
              type="button"
              className={btnSubtle}
              onClick={() => {
                bulkStatus(selected, "Active");
                toast.success("Marked active");
              }}
            >
              Mark active
            </button>
            <button
              type="button"
              className={btnSubtle}
              onClick={() => {
                bulkStatus(selected, "Draft");
                toast.success("Moved to draft");
              }}
            >
              Move to draft
            </button>
            <button
              type="button"
              className={`${btnSubtle} text-primary hover:text-primary`}
              onClick={() => setConfirm(selected)}
            >
              Delete
            </button>
          </motion.div>
        )}

        {!ready ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No products match"
            body="Try clearing the filters, or create your first product for this view."
            action={
              <button type="button" onClick={openCreate} className={btnPrimary}>
                New product
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allChecked}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? Array.from(new Set([...selected, ...rows.map((r) => r.id)]))
                            : selected.filter((id) => !rows.some((r) => r.id === id)),
                        )
                      }
                    />
                  </th>
                  <th className="px-2 py-3 text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-2 py-3 text-xs font-semibold text-muted-foreground">
                    Category
                  </th>
                  <th className="px-2 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                  <th className="px-2 py-3 text-xs font-semibold text-muted-foreground">Stock</th>
                  <th className="px-2 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selected.includes(p.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, p.id]
                              : selected.filter((id) => id !== p.id),
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        {p.images[0] && (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-sm object-cover"
                          />
                        )}
                        <span className="font-medium tracking-tight">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-2 py-3 tabular-nums">{formatPrice(p.price)}</td>
                    <td className="px-2 py-3 tabular-nums">
                      <span
                        className={p.stock <= lowStockThreshold ? "font-semibold text-primary" : ""}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => openEdit(p)}
                          className={btnSubtle}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Duplicate ${p.name}`}
                          onClick={() => {
                            duplicateProduct(p.id);
                            toast.success("Duplicated as draft");
                          }}
                          className={btnSubtle}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${p.name}`}
                          onClick={() => setConfirm([p.id])}
                          className={`${btnSubtle} hover:text-primary`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} product{filtered.length === 1 ? "" : "s"} · page {current} of{" "}
              {pages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                className={btnGhost}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
                className={btnGhost}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Panel>

      <SlideOver
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit product" : "New product"}
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={submit}>
              {editing ? "Save changes" : "Create product"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" error={errors["name"]}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="Ronin Heavyweight Hoodie"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputCls}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price (₦)" error={errors["price"]}>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                inputMode="decimal"
                className={inputCls}
                placeholder="15000"
              />
            </Field>
            <Field label="Compare-at price (₦)" error={errors["compareAtPrice"]} hint="Optional">
              <input
                value={form.compareAtPrice}
                onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                inputMode="decimal"
                className={inputCls}
                placeholder="20000"
              />
            </Field>
          </div>

          <Field label="Description" error={errors["description"]}>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className={`${inputCls} h-auto py-2.5`}
              placeholder="Materials, fit, finish…"
            />
          </Field>

          {form.variants.length === 0 && (
            <Field label="Stock" error={errors["stock"]}>
              <input
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                inputMode="numeric"
                className={inputCls}
              />
            </Field>
          )}

          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow text-[10px] text-muted-foreground">Images</span>
              <div className="flex items-center gap-2">
                <label
                  className={`${btnSubtle} cursor-pointer ${uploading ? "opacity-60" : ""}`}
                  aria-busy={uploading}
                >
                  {uploading ? "Uploading…" : "Upload photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => void handleFiles(e.target.files)}
                  />
                </label>
                <button
                  type="button"
                  className={btnSubtle}
                  onClick={() => setForm({ ...form, images: [...form.images, ""] })}
                >
                  Add URL
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload photos straight from your device, or paste a URL. The first image is the main
              product image.
            </p>
            <div className="mt-2 space-y-2">
              {form.images.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-sm border border-border bg-surface-2 text-[10px] text-muted-foreground">
                    {url.trim() ? (
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <input
                    value={url}
                    onChange={(e) => {
                      const images = [...form.images];
                      images[i] = e.target.value;
                      setForm({ ...form, images });
                    }}
                    placeholder="https://… or /src/assets/hoodie.jpg"
                    aria-label={`Image URL ${i + 1}`}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() =>
                      setForm({ ...form, images: form.images.filter((_, j) => j !== i) })
                    }
                    className={`${btnSubtle} shrink-0`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow text-[10px] text-muted-foreground">Variants</span>
              <button
                type="button"
                className={btnSubtle}
                onClick={() =>
                  setForm({ ...form, variants: [...form.variants, { label: "", stock: "0" }] })
                }
              >
                Add variant
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {form.variants.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No variants — the product uses a single stock count.
                </p>
              )}
              {form.variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={v.label}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i] = { ...v, label: e.target.value };
                      setForm({ ...form, variants });
                    }}
                    placeholder="Size / colour"
                    className={inputCls}
                  />
                  <input
                    value={v.stock}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i] = { ...v, stock: e.target.value };
                      setForm({ ...form, variants });
                    }}
                    inputMode="numeric"
                    className={`${inputCls} w-24`}
                  />
                  <button
                    type="button"
                    aria-label="Remove variant"
                    onClick={() =>
                      setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })
                    }
                    className={`${btnSubtle} shrink-0`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-surface-2 p-4">
            <p className="eyebrow text-[10px] text-muted-foreground">Storefront preview</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">
                  {form.name || "Untitled product"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{form.category}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                {formatPrice(Number(form.price) || 0)}
              </p>
            </div>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm && confirm.length > 1 ? `Delete ${confirm.length} products?` : "Delete product?"
        }
        body="This permanently removes the item from your catalogue and the storefront. This cannot be undone."
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteProducts(confirm);
            setSelected([]);
            toast.success(
              confirm.length > 1 ? `${confirm.length} products deleted` : "Product deleted",
            );
          }
          setConfirm(null);
        }}
      />
    </AdminShell>
  );
}
