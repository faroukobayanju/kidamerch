import necklaces from "@/assets/c-necklaces.jpg";
import rings from "@/assets/c-rings.jpg";
import headbands from "@/assets/c-headbands.jpg";
import earrings from "@/assets/c-earrings.jpg";
import accessories from "@/assets/c-accessories.jpg";
import newDrops from "@/assets/c-new-drops.jpg";

export const CATEGORY_NAMES = [
  "Necklaces",
  "Rings",
  "Headbands",
  "Earrings",
  "Accessories",
  "New Drops",
] as const;

export type Category = (typeof CATEGORY_NAMES)[number];

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  images: string[];
  variants: string[];
  inStock: boolean;
  popularity: number;
  createdAt: string;
  tag?: string;
};

/**
 * Live catalogue registry.
 *
 * The real catalogue is owned by the data store (backed by Supabase). This
 * array mirrors it so non-reactive helpers like `getProduct` — used by the cart
 * and wishlist to rehydrate saved ids — can resolve products without needing
 * access to React context. Components that must re-render on catalogue changes
 * should read `storefrontProducts` from `useData()` instead of this array.
 */
export const products: Product[] = [];

/** Replaces the registry contents in place, keeping the exported reference stable. */
export function setCatalogue(next: Product[]) {
  products.length = 0;
  products.push(...next);
}

export const categories: { name: Category; blurb: string; image: string }[] = [
  { name: "Necklaces", blurb: "Chains, pendants & layers", image: necklaces },
  { name: "Rings", blurb: "Stacks & statement bands", image: rings },
  { name: "Headbands", blurb: "Crowns & hair pieces", image: headbands },
  { name: "Earrings", blurb: "Studs, hoops & drops", image: earrings },
  { name: "Accessories", blurb: "Finishing touches", image: accessories },
  { name: "New Drops", blurb: "Fresh in this week", image: newDrops },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);

/** Price slider bounds used when the catalogue is empty. */
export const PRICE_FALLBACK_MIN = 0;
export const PRICE_FALLBACK_MAX = 500_000;

/** All KIDA pricing is in Nigerian Naira. */
export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
