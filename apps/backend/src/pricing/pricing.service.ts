import { Injectable, Logger } from '@nestjs/common';
import type { PricingPackage, PricingResponse, PriceUnit } from '@cinderella/api-types';

/**
 * Pricing is configured entirely through env (PRICING_PACKAGES_JSON +
 * PRICING_CURRENCY) so the baseline prices can change in production without a
 * code deploy. Nothing here hardcodes an amount — if the env var is missing or
 * malformed we serve an empty list and log loudly.
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private cache: PricingResponse | null = null;

  getPricing(): PricingResponse {
    if (this.cache) return this.cache;

    const currency = (process.env.PRICING_CURRENCY || 'usd').toLowerCase();
    const packages = this.parsePackages(process.env.PRICING_PACKAGES_JSON);

    this.cache = { currency, packages };
    return this.cache;
  }

  /** Look up a single package by id (used to validate the new-shoot flow). */
  findPackage(id: string): PricingPackage | undefined {
    return this.getPricing().packages.find((p) => p.id === id);
  }

  private parsePackages(raw: string | undefined): PricingPackage[] {
    if (!raw || !raw.trim()) {
      this.logger.warn('PRICING_PACKAGES_JSON is not set — no packages will be advertised.');
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('expected a JSON array');
      return parsed
        .filter((p) => p && typeof p.id === 'string' && Number.isFinite(p.priceCents))
        .map((p): PricingPackage => ({
          id: String(p.id),
          name: String(p.name ?? p.id),
          description: String(p.description ?? ''),
          priceCents: Math.round(Number(p.priceCents)),
          unit: (p.unit === 'hour' ? 'hour' : 'flat') as PriceUnit,
          ...(p.featured ? { featured: true } : {}),
          ...(p.startingAt ? { startingAt: true } : {}),
        }));
    } catch (err) {
      this.logger.error(`Failed to parse PRICING_PACKAGES_JSON: ${(err as Error).message}`);
      return [];
    }
  }
}
