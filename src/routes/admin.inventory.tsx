import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  EmptyState,
  Panel,
  PanelHead,
  StatusBadge,
  btnSubtle,
  inputCls,
} from "@/components/admin/parts";
import { NO_VARIANT_KEY, useData, type StockAdjustment } from "@/lib/data-store";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryPage,
});

const REASONS: StockAdjustment["reason"][] = ["Restock", "Damaged", "Correction"];

function InventoryPage() {
  const {
    products,
    adjustments,
    adjustStock,
    setVariantStock,
    lowStockThreshold,
    setLowStockThreshold,
  } = useData();
  const [thresholdDraft, setThresholdDraft] = useState(String(lowStockThreshold));
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [reason, setReason] = useState<StockAdjustment["reason"]>("Restock");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q))
      .filter((p) => !lowOnly || p.stock <= lowStockThreshold)
      .sort((a, b) => a.stock - b.stock);
  }, [products, query, lowOnly, lowStockThreshold]);

  return (
    <AdminShell
      title="Inventory"
      description={`Stock counts per variant. Anything at or below ${lowStockThreshold} units is flagged, and reaching zero flips the product to Out of Stock in the storefront.`}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <div className="relative min-w-[180px] flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inventory"
                className={`${inputCls} pl-9`}
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={lowOnly}
                onChange={(e) => setLowOnly(e.target.checked)}
              />
              Low stock only
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjustment["reason"])}
              className={`${inputCls} w-auto`}
              aria-label="Adjustment reason"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <span className="whitespace-nowrap text-muted-foreground">Low stock at</span>
              <input
                type="number"
                min={1}
                max={999}
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
                onBlur={() => {
                  const n = Number(thresholdDraft);
                  if (!Number.isFinite(n) || n < 1) {
                    setThresholdDraft(String(lowStockThreshold));
                    return;
                  }
                  const next = Math.max(1, Math.min(999, Math.round(n)));
                  setThresholdDraft(String(next));
                  if (next !== lowStockThreshold) {
                    setLowStockThreshold(next);
                    toast.success(`Low stock alerts now trigger at ${next} units`);
                  }
                }}
                className={`${inputCls} w-20 tabular-nums`}
                aria-label="Low stock threshold"
              />
            </label>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="Nothing to show" body="No products match this filter." />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((p) => {
                const labels = p.variants.length ? p.variants : [NO_VARIANT_KEY];
                return (
                  <li key={p.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {p.images[0] && (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-sm object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        {p.stock === 0 ? (
                          <StatusBadge status="Out of Stock" />
                        ) : p.stock <= lowStockThreshold ? (
                          <StatusBadge status="Low stock" />
                        ) : (
                          <StatusBadge status="Active" />
                        )}
                        <span className="text-sm font-semibold tabular-nums sm:w-14 sm:text-right">
                          {p.stock} <span className="text-xs text-muted-foreground">in stock</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {labels.map((label) => {
                        const qty = p.variantStock[label] ?? 0;
                        return (
                          <div
                            key={label}
                            className="flex items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2 py-1.5"
                          >
                            {label !== NO_VARIANT_KEY && (
                              <span className="min-w-8 text-xs font-semibold text-muted-foreground">
                                {label}
                              </span>
                            )}
                            <button
                              type="button"
                              aria-label={`Decrease ${p.name} ${label}`}
                              className={btnSubtle}
                              onClick={() => {
                                adjustStock(p.id, label, -1, reason);
                              }}
                            >
                              <Minus size={13} />
                            </button>
                            <input
                              value={qty}
                              onChange={(e) =>
                                setVariantStock(p.id, label, Number(e.target.value) || 0)
                              }
                              inputMode="numeric"
                              aria-label={`${p.name} ${label} stock`}
                              className="h-7 w-12 rounded-sm border border-input bg-surface text-center text-xs tabular-nums outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              aria-label={`Increase ${p.name} ${label}`}
                              className={btnSubtle}
                              onClick={() => {
                                adjustStock(p.id, label, 1, reason);
                                if (qty + 1 === 1) toast.success(`${p.name} back in stock`);
                              }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHead title="Adjustment history" />
          {adjustments.length === 0 ? (
            <EmptyState
              title="No adjustments yet"
              body="Stock changes made here are logged with a reason for the demo session."
            />
          ) : (
            <ul className="divide-y divide-border">
              {adjustments.slice(0, 14).map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{a.productName}</p>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        a.delta > 0 ? "text-emerald-500" : "text-primary"
                      }`}
                    >
                      {a.delta > 0 ? "+" : ""}
                      {a.delta}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.variant} · {a.reason} ·{" "}
                    {new Date(a.at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
