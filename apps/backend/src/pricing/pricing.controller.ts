import { Controller, Get } from '@nestjs/common';
import type { PricingResponse } from '@cinderella/api-types';
import { PricingService } from './pricing.service.js';

/**
 * Public — the pricing page and the new-shoot flow both read this. No auth
 * guard: advertised prices are not secret.
 */
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  get(): PricingResponse {
    return this.pricing.getPricing();
  }
}
