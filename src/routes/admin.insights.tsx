import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, Panel, PanelHead } from "@/components/admin/parts";
import { formatPrice } from "@/data/products";
import { makeSalesSeries, useData } from "@/lib/data-store";

export const Route = createFileRoute("/admin/insights")({
  component: InsightsPage,
});

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" };
const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 4,
  fontSize: 12,
};

function InsightsPage() {
  const { orders } = useData();
  const [range, setRange] = useState<7 | 30>(30);
  const series = useMemo(() => makeSalesSeries(range, orders), [range, orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; units: number; revenue: number }>();
    for (const o of orders) {
      if (o.status === "Cancelled" || o.status === "Refunded") continue;
      for (const it of o.items) {
        const entry = map.get(it.productId) ?? { name: it.name, units: 0, revenue: 0 };
        entry.units += it.qty;
        entry.revenue += it.qty * it.price;
        map.set(it.productId, entry);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [orders]);

  const statusMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.status, (map.get(o.status) ?? 0) + 1);
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [orders]);

  return (
    <AdminShell
      title="Insights"
      description="Mock analytics across the catalogue: sales trend, best sellers and fulfilment mix."
      actions={
        <div className="flex rounded-sm border border-border p-0.5">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`h-8 rounded-[2px] px-3 text-xs font-semibold ${
                range === r ? "bg-secondary" : "text-muted-foreground"
              }`}
            >
              Last {r} days
            </button>
          ))}
        </div>
      }
    >
      <Panel>
        <PanelHead title="Revenue trend" />
        <div className="h-72 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={axis}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={axis} tickLine={false} axisLine={false} width={52} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPrice(v)} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHead title="Best sellers" />
          {topProducts.length === 0 ? (
            <EmptyState title="No sales yet" body="Place a mock order to populate this report." />
          ) : (
            <ul className="divide-y divide-border">
              {topProducts.map((p) => (
                <li key={p.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {p.units} units
                  </span>
                  <span className="w-24 text-right text-sm font-semibold tabular-nums">
                    {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHead title="Order status mix" />
          <div className="h-72 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusMix}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
                <YAxis tick={axis} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
