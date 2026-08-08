import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, Panel, inputCls } from "@/components/admin/parts";
import { formatPrice } from "@/data/products";
import { useCustomers } from "@/lib/data-store";

export const Route = createFileRoute("/admin/customers/")({
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useCustomers();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <AdminShell
      title="Customers"
      description="Derived from the mock order history — spend, order count and last activity per person."
    >
      <Panel>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No customers yet" body="Mock orders create customer records." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Customer", "Orders", "Total spent", "Last order"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.email}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/customers/$email"
                        params={{ email: c.email }}
                        className="font-medium hover:text-primary"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.orders.length}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatPrice(c.spent)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.last).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
