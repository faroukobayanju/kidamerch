import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, PackagePlus, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/admin/AdminShell";
import { EASE } from "@/components/Reveal";
import {
  EmptyState,
  Panel,
  PanelHead,
  StatusBadge,
  btnGhost,
  btnPrimary,
} from "@/components/admin/parts";
import { formatPrice } from "@/data/products";
import { makeSalesSeries, useData } from "@/lib/data-store";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Kpi({
  label,
  value,
  delta,
  index,
}: {
  label: string;
  value: string;
  delta: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: index * 0.06 }}
      className="rounded-md border border-border bg-surface p-5 shadow-elevate"
    >
      <p className="eyebrow text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowUpRight size={13} className="text-emerald-500" />
        {delta}
      </p>
    </motion.div>
  );
}

function Dashboard() {
  const { orders, products, categories, lowStockThreshold } = useData();
  const [range, setRange] = useState<7 | 30>(7);
  const series = useMemo(() => makeSalesSeries(range, orders), [range, orders]);

  const paid = orders.filter((o) => o.status !== "Cancelled" && o.status !== "Refunded");
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const aov = paid.length ? revenue / paid.length : 0;
  const lowStock = products.filter((p) => p.stock <= lowStockThreshold);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of paid) {
      for (const it of o.items) {
        const product = products.find((p) => p.id === it.productId);
        const key = product?.category ?? "Other";
        map.set(key, (map.get(key) ?? 0) + it.price * it.qty);
      }
    }
    return Array.from(map, ([name, revenue]) => ({ name, revenue })).sort(
      (a, b) => b.revenue - a.revenue,
    );
  }, [paid, products]);

  const recent = [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);
  const avgPrice = products.length
    ? products.reduce((s, p) => s + p.price, 0) / products.length
    : 0;
  const snapshot: { label: string; value: string }[] = [
    { label: "Products", value: String(products.length) },
    { label: "Active", value: String(products.filter((p) => p.status === "Active").length) },
    { label: "Drafts", value: String(products.filter((p) => p.status === "Draft").length) },
    { label: "Out of stock", value: String(products.filter((p) => p.stock === 0).length) },
    { label: "Categories", value: String(categories.length) },
    { label: "Avg. price", value: formatPrice(avgPrice) },
  ];

  return (
    <AdminShell
      title="Dashboard"
      description="A snapshot of trading performance, catalogue health and what needs attention today."
      actions={
        <>
          <Link to="/admin/products" className={btnPrimary}>
            <PackagePlus size={15} /> New product
          </Link>
          <Link to="/admin/orders" className={btnGhost}>
            View orders
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total revenue" value={formatPrice(revenue)} delta="12.4% vs prev." index={0} />
        <Kpi label="Orders" value={String(orders.length)} delta="8 new this week" index={1} />
        <Kpi label="Avg. order value" value={formatPrice(aov)} delta="3.1% vs prev." index={2} />
        <Kpi
          label="Active products"
          value={String(products.filter((p) => p.status === "Active").length)}
          delta={`${categories.length} categories`}
          index={3}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead
            title="Sales over time"
            action={
              <div className="flex rounded-sm border border-border p-0.5">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`h-7 rounded-[2px] px-3 text-xs font-semibold transition-colors ${
                      range === r
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            }
          />
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatPrice(v)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Revenue by category" />
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatPrice(v)}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHead
            title="Recent orders"
            action={
              <Link to="/admin/orders" className="text-xs font-semibold text-primary">
                View all
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState title="No orders yet" body="Mock orders placed at checkout appear here." />
          ) : (
            <div className="divide-y divide-border">
              {recent.map((o) => (
                <Link
                  key={o.id}
                  to="/admin/orders/$id"
                  params={{ id: o.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 transition-colors hover:bg-secondary/50 sm:flex sm:gap-4"
                >
                  <span className="min-w-0 truncate text-sm sm:order-2 sm:flex-1">
                    {o.customerName}
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums sm:order-4 sm:w-24 sm:shrink-0">
                    {formatPrice(o.total)}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground sm:order-1 sm:w-20 sm:shrink-0 sm:text-foreground">
                    {o.id}
                  </span>
                  <span className="justify-self-end sm:order-3">
                    <StatusBadge status={o.status} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHead
            title="Low stock"
            action={
              <Link to="/admin/inventory" className="text-xs font-semibold text-primary">
                Manage
              </Link>
            }
          />
          {lowStock.length === 0 ? (
            <EmptyState
              title="Stock is healthy"
              body={`Nothing is at or below ${lowStockThreshold} units.`}
            />
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <TriangleAlert size={14} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHead
          title="Catalogue snapshot"
          action={
            <Link to="/admin/products" className="text-xs font-semibold text-primary">
              Manage catalogue
            </Link>
          }
        />
        <dl className="grid grid-cols-2 divide-border sm:grid-cols-3 xl:grid-cols-6">
          {snapshot.map((s) => (
            <div key={s.label} className="border-b border-r border-border p-4 last:border-r-0">
              <dt className="eyebrow text-[10px] text-muted-foreground">{s.label}</dt>
              <dd className="mt-2 text-xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </AdminShell>
  );
}
