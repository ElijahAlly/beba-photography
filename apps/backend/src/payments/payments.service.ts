import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Thin Stripe wrapper. Online payments are *optional* — if STRIPE_SECRET_KEY
 * is unset the rest of the app (cash + waive) still works, and any attempt to
 * use online checkout returns a clear 400. The Stripe client is created lazily
 * so the backend boots fine without keys.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  get configured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  get currency(): string {
    return (process.env.PRICING_CURRENCY || 'usd').toLowerCase();
  }

  private client(): Stripe {
    if (!this.configured) {
      throw new BadRequestException(
        'Online payments are not configured. Use cash, or set STRIPE_SECRET_KEY.',
      );
    }
    if (!this.stripe) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    }
    return this.stripe;
  }

  /** Create a hosted Checkout session for a single shoot. */
  async createCheckoutSession(args: {
    shootId: number;
    title: string;
    amountCents: number;
    clientEmail?: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.client().checkout.sessions.create({
      mode: 'payment',
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      customer_email: args.clientEmail ?? undefined,
      client_reference_id: String(args.shootId),
      metadata: { shootId: String(args.shootId) },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: this.currency,
            unit_amount: args.amountCents,
            product_data: { name: args.title },
          },
        },
      ],
    });
  }

  /** Verify a webhook payload against STRIPE_WEBHOOK_SECRET and parse it. */
  constructEvent(payload: Buffer, signature: string | undefined): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException('STRIPE_WEBHOOK_SECRET not set');
    if (!signature) throw new BadRequestException('Missing stripe-signature header');
    return this.client().webhooks.constructEvent(payload, signature, secret);
  }
}
