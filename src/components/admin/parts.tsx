import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { EASE } from "@/components/Reveal";

export const inputCls =
  "h-11 w-full rounded-sm border border-input bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-[10px] text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1.5 block text-xs text-primary">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-border bg-surface shadow-elevate ${className}`}>
      {children}
    </section>
  );
}

export function PanelHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {action}
    </header>
  );
}

const badgeTone: Record<string, string> = {
  Active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Upcoming: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Shipped: "border-sky-500/30 bg-sky-500/10 text-sky-500",
  Processing: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Pending: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Unpaid: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Draft: "border-border bg-secondary text-muted-foreground",
  Past: "border-border bg-secondary text-muted-foreground",
  Cancelled: "border-primary/40 bg-primary/10 text-primary",
  Refunded: "border-primary/40 bg-primary/10 text-primary",
  "Out of Stock": "border-primary/40 bg-primary/10 text-primary",
  "Low stock": "border-amber-500/30 bg-amber-500/10 text-amber-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        badgeTone[status] ?? "border-border bg-secondary text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: cols }).map((__, c) => (
            <div
              key={c}
              className="h-3 animate-pulse rounded-full bg-secondary"
              style={{ width: c === 0 ? "22%" : `${10 + ((r + c) % 3) * 5}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SlideOver({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label={title}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-surface shadow-lift"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="grid h-9 w-9 place-items-center rounded-sm border border-border hover:bg-secondary"
              >
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
                {footer}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-lift"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            {children && <div className="mt-4">{children}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onCancel} className={btnGhost}>
                Cancel
              </button>
              <button type="button" onClick={onConfirm} className={btnPrimary}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";
export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50";
export const btnSubtle =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-sm px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
