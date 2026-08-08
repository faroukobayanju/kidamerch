import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatPrice } from "@/data/products";
import { useStore } from "@/lib/store";
import { useData } from "@/lib/data-store";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { WhatsAppIcon } from "@/components/icons";
import { buildOrderMessage, openWhatsApp, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { EASE } from "@/components/Reveal";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — KIDA" },
      {
        name: "description",
        content:
          "Send your order to KIDA on WhatsApp. Add your delivery details, review the bag, and we'll confirm availability and payment.",
      },
      { property: "og:title", content: "Checkout — KIDA" },
      { property: "og:description", content: "Orders are confirmed on WhatsApp." },
    ],
  }),
  component: Checkout,
});

const STEPS = ["Details", "Review", "Sent"] as const;

type Details = { name: string; phone: string; address: string; note: string };

function Checkout() {
  const { lines, subtotal, total, clearCart } = useStore();
  const { placeOrder } = useData();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<Details>({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [reference] = useState(() => `KM-${Math.floor(100000 + Math.random() * 899999)}`);
  const [snapshot, setSnapshot] = useState<{ count: number; total: number } | null>(null);

  const empty = lines.length === 0 && step < 2;

  const send = () => {
    const message = buildOrderMessage({
      lines,
      totals: { subtotal, total },
      contact: details,
      reference,
    });

    placeOrder({
      customerName: details.name,
      customerEmail: details.phone,
      address: details.address,
      items: lines.map(({ line, product }) => ({
        productId: product.id,
        name: product.name,
        image: product.images[0]!,
        variant: line.variant,
        qty: line.qty,
        price: product.price,
      })),
      subtotal,
      shipping: 0,
      tax: 0,
      total,
      tracking: null,
      reason: null,
      id: reference,
    });

    setSnapshot({ count: lines.reduce((n, l) => n + l.line.qty, 0), total });
    openWhatsApp(message);
    setStep(2);
    clearCart();
  };

  return (
    <div className="mx-auto max-w-4xl px-5 pt-10 sm:px-8">
      <header className="pb-8">
        <p className="eyebrow text-primary">Order on WhatsApp</p>
        <h1 className="display-xl mt-3 text-5xl sm:text-6xl">Checkout</h1>
      </header>

      <StepIndicator step={step} />

      {empty ? (
        <div className="mt-14 rounded-sm border border-dashed border-border py-20 text-center">
          <h2 className="display-xl text-2xl">Nothing to check out</h2>
          <p className="mt-3 text-sm text-muted-foreground">Add a piece to the bag first.</p>
          <Link
            to="/shop"
            className="eyebrow mt-8 inline-flex h-14 items-center rounded-sm bg-primary px-7 text-primary-foreground"
          >
            Shop the collection
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                {step === 0 && (
                  <DetailsStep
                    initial={details}
                    onNext={(d) => {
                      setDetails(d);
                      setStep(1);
                    }}
                  />
                )}
                {step === 1 && (
                  <ReviewStep
                    details={details}
                    reference={reference}
                    onBack={() => setStep(0)}
                    onSend={send}
                  />
                )}
                {step === 2 && <SentStep reference={reference} snapshot={snapshot} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < 2 && (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-sm border border-border bg-surface p-6">
                <p className="eyebrow text-[10px] text-muted-foreground">Order summary</p>
                <ul className="mt-5 space-y-3 text-sm">
                  {lines.map(({ line, product }) => (
                    <li
                      key={`${line.id}-${line.variant ?? "one"}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{product.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {line.variant ? `${line.variant} · ` : ""}Qty {line.qty}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatPrice(product.price * line.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                  <span className="eyebrow">Total</span>
                  <AnimatedNumber
                    value={total}
                    format={formatPrice}
                    className="text-lg font-semibold tabular-nums text-primary"
                  />
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Delivery is quoted separately on WhatsApp — the cost depends on your location.
                </p>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="rule-line pt-6">
      <div className="flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={`eyebrow truncate text-[10px] ${
                  i <= step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="text-primary">{String(i + 1).padStart(2, "0")}</span> {label}
              </p>
              <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const fieldClass =
  "h-14 w-full rounded-sm border border-input bg-background px-4 text-sm outline-none transition-colors duration-200 focus:border-primary";

function DetailsStep({ initial, onNext }: { initial: Details; onNext: (d: Details) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const note = String(data.get("note") ?? "").trim();

    if (name.length < 2) next["name"] = "Enter your full name.";
    if (phone.replace(/\D/g, "").length < 7) next["phone"] = "Enter a reachable phone number.";
    if (address.length < 6) next["address"] = "Enter a delivery address.";

    setErrors(next);
    if (Object.keys(next).length === 0) onNext({ name, phone, address, note });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="display-xl text-2xl">Delivery details</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        We confirm every order personally on WhatsApp. Delivery cost varies by location, so we share
        it in the chat once we have your address.
      </p>
      <Field label="Full name" error={errors["name"]}>
        <input
          name="name"
          defaultValue={initial.name}
          className={fieldClass}
          placeholder="Rei Tanaka"
        />
      </Field>
      <Field label="Phone number" error={errors["phone"]}>
        <input
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          className={fieldClass}
          placeholder="+234 800 000 0000"
        />
      </Field>
      <Field label="Delivery address" error={errors["address"]}>
        <input
          name="address"
          defaultValue={initial.address}
          className={fieldClass}
          placeholder="12 Warehouse Lane, Lagos"
        />
      </Field>
      <Field label="Note (optional)">
        <textarea
          name="note"
          defaultValue={initial.note}
          rows={3}
          placeholder="Anything we should know?"
          className="w-full rounded-sm border border-input bg-background p-4 text-sm outline-none transition-colors duration-200 focus:border-primary"
        />
      </Field>
      <button
        type="submit"
        className="eyebrow h-14 w-full rounded-sm bg-primary text-primary-foreground transition-opacity duration-200 hover:opacity-90 sm:w-auto sm:px-10"
      >
        Review order
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-[10px] text-muted-foreground">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-2 block text-xs text-primary">{error}</span>}
    </label>
  );
}

function ReviewStep({
  details,
  reference,
  onSend,
  onBack,
}: {
  details: Details;
  reference: string;
  onSend: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="display-xl text-2xl">Review &amp; send</h2>

      <div className="rounded-sm border border-border bg-surface p-6">
        <p className="eyebrow text-[10px] text-muted-foreground">Sending to</p>
        <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-primary">
          <WhatsAppIcon size={18} /> {WHATSAPP_DISPLAY}
        </p>
        <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
          <Row label="Order ref" value={reference} />
          <Row label="Name" value={details.name} />
          <Row label="Phone" value={details.phone} />
          <Row label="Address" value={details.address} />
          {details.note && <Row label="Note" value={details.note} />}
        </dl>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Tapping the button opens WhatsApp with your order pre-filled. Nothing is charged here —
        payment is arranged in the chat.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="eyebrow h-14 rounded-sm border border-border px-7 transition-colors duration-200 hover:bg-secondary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSend}
          className="eyebrow inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-7 text-primary-foreground transition-opacity duration-200 hover:opacity-90 sm:flex-none"
        >
          <WhatsAppIcon size={16} /> Send order on WhatsApp
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium">{value}</dd>
    </div>
  );
}

function SentStep({
  reference,
  snapshot,
}: {
  reference: string;
  snapshot: { count: number; total: number } | null;
}) {
  const reduce = useReducedMotion();
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBurst(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="text-center lg:text-left">
      <div className="relative mx-auto h-24 w-24 lg:mx-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border)" strokeWidth="3" />
          <motion.path
            d="M28 52 L44 68 L73 36"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE }}
          />
        </svg>
        {!reduce &&
          burst &&
          Array.from({ length: 10 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-primary"
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: Math.cos((i / 10) * Math.PI * 2) * 70,
                y: Math.sin((i / 10) * Math.PI * 2) * 70,
              }}
              transition={{ duration: 0.8, ease: EASE }}
            />
          ))}
      </div>

      <h2 className="display-xl mt-8 text-4xl">Order sent</h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        WhatsApp should have opened with your order ready to send. If it didn't, message us on{" "}
        <span className="font-semibold text-primary">{WHATSAPP_DISPLAY}</span> with your order ref.
      </p>

      <dl className="mt-10 grid max-w-md gap-6 rule-line pt-6 text-left sm:grid-cols-3">
        <div>
          <dt className="eyebrow text-[10px] text-muted-foreground">Order ref</dt>
          <dd className="mt-1 font-semibold tabular-nums">{reference}</dd>
        </div>
        <div>
          <dt className="eyebrow text-[10px] text-muted-foreground">Items</dt>
          <dd className="mt-1 font-semibold tabular-nums">{snapshot?.count ?? 0}</dd>
        </div>
        <div>
          <dt className="eyebrow text-[10px] text-muted-foreground">Total</dt>
          <dd className="mt-1 font-semibold tabular-nums text-primary">
            {formatPrice(snapshot?.total ?? 0)}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
        <Link
          to="/shop"
          className="eyebrow inline-flex h-14 items-center rounded-sm bg-primary px-7 text-primary-foreground"
        >
          Keep shopping
        </Link>
        <Link
          to="/"
          className="eyebrow inline-flex h-14 items-center rounded-sm border border-border px-7"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
