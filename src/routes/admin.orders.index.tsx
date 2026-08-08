import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  EmptyState,
  Panel,
  StatusBadge,
  TableSkeleton,
  btnGhost,
  inputCls,
} from "@/components/admin/parts";
import { formatPrice } from "@/data/products";
import { useData, type OrderStatus } from "@/lib/data-store";

export const Route = createFileRoute("/admin/orders/")({
  component: OrdersPage,
});

const STATUSES: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const PER_PAGE = 10;

function OrdersPage() {
  const { orders, ready, advanceOrder } = useData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = orders.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (q === "" ||
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)),
    );
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (sort === "oldest") sorted.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    if (sort === "total") sorted.sort((a, b) => b.total - a.total);
    return sorted;
  }, [orders, query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const counts = STATUSES.map((s) => ({ s, n: orders.filter((o) => o.status === s).length }));

  return (
    <AdminShell
      title="Orders"
      description="Every mock order, including checkouts placed in the storefront. Advance fulfilment or open an order for the full timeline."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus("all")}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            status === "all" ? "border-primary bg-primary/10 text-primary" : "border-border"
          }`}
        >
          All {orders.length}
        </button>
        {counts.map(({ s, n }) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              status === s ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            {s} {n}
          </button>
        ))}
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-[200px] flex-1">
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
              placeholder="Search by order ID, name or email"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total">Highest total</option>
          </select>
        </div>

        {!ready ? (
          <TableSkeleton rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No orders found"
            body="Adjust the filters, or place a mock order through the storefront checkout to see it land here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Order", "Customer", "Date", "Items", "Total", "Payment", "Status", ""].map(
                    (h) => (
                      <th key={h} className="px-3 py-3 text-xs font-semibold text-muted-foreground">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-3 py-3">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: o.id }}
                        className="font-semibold tabular-nums hover:text-primary"
                      >
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {o.items.reduce((n, i) => n + i.qty, 0)}
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums">{formatPrice(o.total)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={o.payment} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      {["Pending", "Processing", "Shipped"].includes(o.status) && (
                        <button
                          type="button"
                          onClick={() => advanceOrder(o.id)}
                          className="text-xs font-semibold text-primary"
                        >
                          Advance
                        </button>
                      )}
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
              {filtered.length} orders · page {current} of {pages}
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
    </AdminShell>
  );
}
