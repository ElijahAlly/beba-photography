import {
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service.js';
import { ShootsService } from './shoots.service.js';

/**
 * Public Stripe webhook. No JWT guard — the Stripe signature (verified against
 * STRIPE_WEBHOOK_SECRET using the *raw* request body) is the trust boundary.
 * Raw body capture is enabled via `rawBody: true` in main.ts.
 */
@Controller('payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly shoots: ShootsService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.payments.constructEvent(req.rawBody as Buffer, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const shootId = Number(session.metadata?.shootId ?? session.client_reference_id);
      const amount = session.amount_total ?? 0;
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      if (Number.isFinite(shootId)) {
        await this.shoots.fulfillStripePayment(shootId, amount, paymentIntentId);
        this.logger.log(`Fulfilled Stripe payment for shoot ${shootId}.`);
      }
    }

    return { received: true };
  }
}
