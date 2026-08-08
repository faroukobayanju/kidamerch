import { formatPrice, type Product } from "@/data/products";
import type { CartLine } from "@/lib/store";

/** Every order on the storefront is routed to this WhatsApp line. */
export const WHATSAPP_NUMBER = "2347078021181";
export const WHATSAPP_DISPLAY = "+234 707 802 1181";

export type OrderContact = {
  name?: string;
  phone?: string;
  address?: string;
  note?: string;
};

export type OrderTotals = {
  subtotal: number;
  total: number;
};

const NL = "\n";

/** wa.me link for a free-form message. */
export function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Opens WhatsApp in a new tab. Safe to call from a click handler. */
export function openWhatsApp(message: string) {
  if (typeof window === "undefined") return;
  window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
}

/** "I want to order this one item" — used on product pages. */
export function buildProductMessage(
  product: Pick<Product, "name" | "price">,
  variant: string | null,
  qty = 1,
) {
  return [
    "Hi KIDA! I'd like to order:",
    "",
    `• ${product.name}${variant ? ` (${variant})` : ""} × ${qty} — ${formatPrice(
      product.price * qty,
    )}`,
    "",
    "Is this available?",
  ].join(NL);
}

/** Full bag order — used in the cart, cart drawer and checkout. */
export function buildOrderMessage({
  lines,
  totals,
  contact,
  reference,
}: {
  lines: { line: CartLine; product: Product }[];
  totals: OrderTotals;
  contact?: OrderContact;
  reference?: string;
}) {
  const rows = lines.map(
    ({ line, product }) =>
      `• ${product.name}${line.variant ? ` (${line.variant})` : ""} × ${line.qty} — ${formatPrice(
        product.price * line.qty,
      )}`,
  );

  const out = ["Hi KIDA! I'd like to place an order."];

  if (reference) out.push("", `Order ref: ${reference}`);

  out.push("", "*Items*", ...rows);

  out.push("", "*Summary*", `Total: ${formatPrice(totals.total)}`, "Delivery: quoted separately");

  const details = [
    contact?.name ? `Name: ${contact.name}` : null,
    contact?.phone ? `Phone: ${contact.phone}` : null,
    contact?.address ? `Delivery address: ${contact.address}` : null,
    contact?.note ? `Note: ${contact.note}` : null,
  ].filter(Boolean) as string[];

  if (details.length) out.push("", "*Delivery details*", ...details);

  out.push(
    "",
    "Please confirm availability, delivery cost for my location, and payment details. Thank you!",
  );

  return out.join(NL);
}
