import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  Panel,
  PanelHead,
  StatusBadge,
  btnGhost,
  btnPrimary,
  inputCls,
} from "@/components/admin/parts";
import { formatPrice } from "@/data/products";
import { useData, type OrderStatus } from "@/lib/data-store";

export const Route = createFileRoute("/admin/orders/$id")({
  component: OrderDetail,
});

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  Pending: "Processing",
  Processing: "Shipped",
  Shipped: "Delivered",
};

function OrderDetail() {
  const { id } = useParams({ from: "/admin/orders/$id" });
  const { orders, advanceOrder, setOrderStatus, setTracking } = useData();
  const order = orders.find((o) => o.id === id);
  const [tracking, setTrackingInput] = useState("");
  const [dialog, setDialog] = useState<null | "cancel" | "refund">(null);
  const [reason, setReason] = useState("");

  if (!order) {
    return (
      <AdminShell title="Order not found">
        <Panel>
          <EmptyState
            title="That order no longer exists"
            body="It may have been removed from the mock dataset."
            action={
              <Link to="/admin/orders" className={btnPrimary}>
                Back to orders
              </Link>
            }
          />
        </Panel>
      </AdminShell>
    );
  }

  const next = NEXT[order.status];

  return (
    <AdminShell
      title={`Order ${order.id}`}
      actions={
        <>
          {next && (
            <button type="button" className={btnPrimary} onClick={() => advanceOrder(order.id)}>
              Mark {next}
            </button>
          )}
          <button type="button" className={btnGhost} onClick={() => setDialog("refund")}>
            Refund
          </button>
          <button type="button" className={btnGhost} onClick={() => setDialog("cancel")}>
            Cancel
          </button>
        </>
      }
    >
      <Link
        to="/admin/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> All orders
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <PanelHead title="Items" action={<StatusBadge status={order.status} />} />
            <ul className="divide-y divide-border">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <img src={it.image} alt="" className="h-12 w-12 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tracking-tight">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.variant ? `${it.variant} · ` : ""}Qty {it.qty}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatPrice(it.price * it.qty)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-border px-4 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>Quoted on WhatsApp</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Timeline" />
            <ol className="space-y-4 px-4 py-4">
              {order.history.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">{h.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHead title="Customer" />
            <div className="space-y-3 px-4 py-4 text-sm">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
              </div>
              <div>
                <p className="eyebrow text-[10px] text-muted-foreground">Delivery address</p>
                <p className="mt-1 text-sm">{order.address}</p>
              </div>
              <Link
                to="/admin/customers/$email"
                params={{ email: order.customerEmail }}
                className="inline-block text-xs font-semibold text-primary"
              >
                View customer profile
              </Link>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Fulfilment" />
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <StatusBadge status={order.payment} />
              </div>
              <Field label="Tracking number" hint={order.tracking ?? "Not yet shipped"}>
                <input
                  value={tracking}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="KGX000000DE"
                  className={inputCls}
                />
              </Field>
              <button
                type="button"
                className={`${btnGhost} w-full`}
                onClick={() => {
                  if (!tracking.trim()) return;
                  setTracking(order.id, tracking.trim());
                  setTrackingInput("");
                  toast.success("Tracking saved");
                }}
              >
                <Truck size={15} /> Save tracking
              </button>
              {order.reason && (
                <p className="rounded-sm border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                  Reason: {order.reason}
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog === "refund" ? "Refund this order?" : "Cancel this order?"}
        body={
          dialog === "refund"
            ? "The order will be marked refunded and payment set to Refunded."
            : "The order will be marked cancelled and removed from fulfilment."
        }
        confirmLabel={dialog === "refund" ? "Refund order" : "Cancel order"}
        onCancel={() => {
          setDialog(null);
          setReason("");
        }}
        onConfirm={() => {
          setOrderStatus(order.id, dialog === "refund" ? "Refunded" : "Cancelled", reason.trim());
          toast.success(dialog === "refund" ? "Order refunded" : "Order cancelled");
          setDialog(null);
          setReason("");
        }}
      >
        <Field label="Reason" hint="Optional, saved to the timeline">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputCls}
            placeholder="Customer request"
          />
        </Field>
      </ConfirmDialog>
    </AdminShell>
  );
}
