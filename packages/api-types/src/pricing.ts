/** How a package's price is metered. */
export type PriceUnit = 'flat' | 'hour';

/**
 * A bookable pricing package. These are configured entirely via the
 * PRICING_PACKAGES_JSON env var on the backend — no prices live in code —
 * and surfaced to the public pricing page and the new-shoot flow.
 */
export interface PricingPackage {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  unit: PriceUnit;
  /** Highlight this package in the UI. */
  featured?: boolean;
  /** Render as a "from / starting at" price (e.g. multi-photographer 500+). */
  startingAt?: boolean;
}

export interface PricingResponse {
  currency: string; // ISO code, e.g. "usd"
  packages: PricingPackage[];
}
