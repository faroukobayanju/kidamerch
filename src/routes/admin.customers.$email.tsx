import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, Panel, PanelHead, StatusBadge, btnPrimary } from "@/components/admin/parts";
import { formatPrice } from "@/data/products";
import { useCustomers } from "@/lib/data-store";

export const Route = createFileRoute("/admin/customers/$email")({
  component: CustomerDetail,
});

function CustomerDetail() {
  const { email } = useParams({ from: "/admin/customers/$email" });
  const customer = useCustomers().find((c) => c.email === email);

  if (!customer) {
    return (
      <AdminShell title="Customer not found">
        <Panel>
          <EmptyState
            title="No record for this customer"
            body="They may have no orders in the mock dataset."
            action={
              <Link to="/admin/customers" className={btnPrimary}>
                Back to customers
              </Link>
            }
          />
        </Panel>
      </AdminShell>
    );
  }

  const orders = [...customer.orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const aov = customer.orders.length ? customer.spent / customer.orders.length : 0;

  return (
    <AdminShell title={customer.name}>
      <Link
        to="/admin/customers"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> All customers
      </Link>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total spent", formatPrice(customer.spent)],
          ["Orders", String(customer.orders.length)],
          ["Avg. order value", formatPrice(aov)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-border bg-surface p-5 shadow-elevate"
          >
            <p className="eyebrow text-[10px] text-muted-foreground">{label}</p>
            <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <Panel className="mt-4">
        <PanelHead title="Contact" />
        <div className="px-4 py-4 text-sm">
          <p className="text-muted-foreground">{customer.email}</p>
          <p className="mt-1">{orders[0]?.address}</p>
        </div>
      </Panel>

      <Panel className="mt-4">
        <PanelHead title="Order history" />
        <ul className="divide-y divide-border">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to="/admin/orders/$id"
                params={{ id: o.id }}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/50"
              >
                <span className="w-20 shrink-0 text-xs font-semibold tabular-nums">{o.id}</span>
                <span className="flex-1 text-sm text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <StatusBadge status={o.status} />
                <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatPrice(o.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </AdminShell>
  );
}
