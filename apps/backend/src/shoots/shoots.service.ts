import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module.js';
import {
  clients,
  photographers,
  shootMedia,
  shoots,
} from '@cinderella/database';
import { and, desc, eq } from 'drizzle-orm';
import { MediaService } from '../media/media.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import type { PaymentMethod } from '@cinderella/api-types';

@Injectable()
export class ShootsService {
  private readonly logger = new Logger(ShootsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly mediaService: MediaService,
    private readonly payments: PaymentsService,
  ) {}

  private async photographerByUserId(mytreesUserId: string) {
    const [row] = await this.db
      .select()
      .from(photographers)
      .where(eq(photographers.mytreesUserId, mytreesUserId))
      .limit(1);
    return row || null;
  }

  async listForPhotographer(mytreesUserId: string) {
    const photographer = await this.photographerByUserId(mytreesUserId);
    if (!photographer) return [];

    return this.db
      .select({
        id: shoots.id,
        title: shoots.title,
        status: shoots.status,
        scheduledFor: shoots.scheduledFor,
        location: shoots.location,
        totalPriceCents: shoots.totalPriceCents,
        paidAt: shoots.paidAt,
        notes: shoots.notes,
        createdAt: shoots.createdAt,
        clientId: shoots.clientId,
        clientName: clients.name,
        clientEmail: clients.email,
      })
      .from(shoots)
      .leftJoin(clients, eq(shoots.clientId, clients.id))
      .where(eq(shoots.photographerId, photographer.id))
      .orderBy(desc(shoots.createdAt));
  }

  /**
   * Fetch a single shoot the caller is allowed to see (either the
   * photographer who owns it, or the client linked to it).
   */
  async getOneForUser(shootId: number, mytreesUserId: string) {
    const [row] = await this.db
      .select({
        id: shoots.id,
        title: shoots.title,
        status: shoots.status,
        scheduledFor: shoots.scheduledFor,
        location: shoots.location,
        totalPriceCents: shoots.totalPriceCents,
        pricePackageId: shoots.pricePackageId,
        paidAt: shoots.paidAt,
        paymentMethod: shoots.paymentMethod,
        amountPaidCents: shoots.amountPaidCents,
        notes: shoots.notes,
        createdAt: shoots.createdAt,
        photographerId: shoots.photographerId,
        photographerUserId: photographers.mytreesUserId,
        clientId: shoots.clientId,
        clientName: clients.name,
        clientEmail: clients.email,
        clientUserId: clients.mytreesUserId,
      })
      .from(shoots)
      .innerJoin(photographers, eq(shoots.photographerId, photographers.id))
      .innerJoin(clients, eq(shoots.clientId, clients.id))
      .where(eq(shoots.id, shootId))
      .limit(1);

    if (!row) throw new NotFoundException('Shoot not found');

    const isPhotographer = row.photographerUserId === mytreesUserId;
    const isClient = row.clientUserId === mytreesUserId;
    if (!isPhotographer && !isClient) {
      throw new ForbiddenException('Not your shoot');
    }

    return { ...row, viewerRole: isPhotographer ? 'photographer' : 'client' as const };
  }

  async create(args: {
    mytreesUserId: string;
    clientId: number;
    title: string;
    scheduledFor?: string;
    location?: string;
    totalPriceCents?: number;
    pricePackageId?: string;
    notes?: string;
  }) {
    const photographer = await this.photographerByUserId(args.mytreesUserId);
    if (!photographer)
      throw new ForbiddenException('Not a photographer — register a studio first');

    const [client] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, args.clientId), eq(clients.photographerId, photographer.id)))
      .limit(1);
    if (!client) throw new NotFoundException('Client not found');

    const [row] = await this.db
      .insert(shoots)
      .values({
        photographerId: photographer.id,
        clientId: args.clientId,
        title: args.title,
        scheduledFor: args.scheduledFor ? new Date(args.scheduledFor) : null,
        location: args.location ?? null,
        totalPriceCents: args.totalPriceCents ?? 0,
        pricePackageId: args.pricePackageId ?? null,
        notes: args.notes ?? null,
      })
      .returning();
    return row;
  }

  /**
   * Confirms the requester is the shoot's photographer. Returns the shoot's
   * numeric id and photographer row so the caller can act on them. Used by
   * upload + mark-paid endpoints to gate writes.
   */
  async assertPhotographerOwns(shootId: number, mytreesUserId: string) {
    const [row] = await this.db
      .select({
        shootId: shoots.id,
        photographerId: shoots.photographerId,
        photographerUserId: photographers.mytreesUserId,
      })
      .from(shoots)
      .innerJoin(photographers, eq(shoots.photographerId, photographers.id))
      .where(eq(shoots.id, shootId))
      .limit(1);
    if (!row) throw new NotFoundException('Shoot not found');
    if (row.photographerUserId !== mytreesUserId) {
      throw new ForbiddenException('Not your shoot');
    }
    return row;
  }

  async listMedia(shootId: number, mytreesUserId: string) {
    // Reuse the access check from getOneForUser — throws if unauthorized.
    await this.getOneForUser(shootId, mytreesUserId);
    return this.db
      .select()
      .from(shootMedia)
      .where(eq(shootMedia.shootId, shootId))
      .orderBy(shootMedia.uploadedAt);
  }

  /**
   * Record a manual (off-platform) payment: cash, e-transfer, or a waiver.
   * Photographer-only. `waived` defaults the amount to 0; `cash` defaults to
   * the shoot's total. Flips status to paid and runs the ownership transfer.
   */
  async recordPayment(
    shootId: number,
    mytreesUserId: string,
    opts: { method: 'cash' | 'waived'; amountCents?: number },
  ) {
    await this.assertPhotographerOwns(shootId, mytreesUserId);
    return this.applyPaid(shootId, { method: opts.method, amountCents: opts.amountCents });
  }

  /**
   * Start an online payment: creates a Stripe Checkout session for the shoot's
   * total and returns the hosted URL. Photographer-only. The shoot is only
   * marked paid later, when Stripe calls our webhook.
   */
  async createCheckout(shootId: number, mytreesUserId: string) {
    await this.assertPhotographerOwns(shootId, mytreesUserId);

    const [shoot] = await this.db
      .select({
        id: shoots.id,
        title: shoots.title,
        status: shoots.status,
        totalPriceCents: shoots.totalPriceCents,
        clientEmail: clients.email,
      })
      .from(shoots)
      .innerJoin(clients, eq(shoots.clientId, clients.id))
      .where(eq(shoots.id, shootId))
      .limit(1);
    if (!shoot) throw new NotFoundException('Shoot not found');
    if (shoot.status === 'paid') throw new BadRequestException('Shoot is already paid');
    if (!shoot.totalPriceCents || shoot.totalPriceCents <= 0) {
      throw new BadRequestException('Set a price before collecting payment');
    }

    const origin = (process.env.FRONTEND_ORIGIN || 'http://localhost:3002')
      .split(',')[0]!
      .trim()
      .replace(/\/$/, '');

    const session = await this.payments.createCheckoutSession({
      shootId: shoot.id,
      title: shoot.title,
      amountCents: shoot.totalPriceCents,
      clientEmail: shoot.clientEmail,
      successUrl: `${origin}/shoots/${shoot.id}?paid=1`,
      cancelUrl: `${origin}/shoots/${shoot.id}?canceled=1`,
    });

    await this.db
      .update(shoots)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(shoots.id, shoot.id));

    if (!session.url) throw new BadRequestException('Stripe did not return a checkout URL');
    return { url: session.url };
  }

  /**
   * Fulfill a verified Stripe payment (called from the webhook — no user check,
   * the signature is the trust boundary). Idempotent: re-delivered events for an
   * already-paid shoot are ignored.
   */
  async fulfillStripePayment(
    shootId: number,
    amountCents: number,
    stripePaymentIntentId?: string,
  ) {
    const [shoot] = await this.db
      .select({ id: shoots.id, paidAt: shoots.paidAt })
      .from(shoots)
      .where(eq(shoots.id, shootId))
      .limit(1);
    if (!shoot) {
      this.logger.warn(`Stripe webhook for unknown shoot ${shootId} — ignoring.`);
      return { ignored: true as const };
    }
    if (shoot.paidAt) return { alreadyPaid: true as const };

    return this.applyPaid(shootId, {
      method: 'stripe',
      amountCents,
      stripePaymentIntentId,
    });
  }

  /**
   * Shared "mark paid" core: transfers media ownership to the linked client (if
   * any) and stamps status/paid_at/payment_method/amount on the shoot. Media for
   * a not-yet-linked client stays with the photographer until they sign in.
   */
  private async applyPaid(
    shootId: number,
    opts: { method: PaymentMethod; amountCents?: number; stripePaymentIntentId?: string },
  ) {
    const [shoot] = await this.db
      .select({
        id: shoots.id,
        totalPriceCents: shoots.totalPriceCents,
        clientUserId: clients.mytreesUserId,
      })
      .from(shoots)
      .innerJoin(clients, eq(shoots.clientId, clients.id))
      .where(eq(shoots.id, shootId))
      .limit(1);
    if (!shoot) throw new NotFoundException('Shoot not found');

    const amountPaidCents =
      opts.amountCents ?? (opts.method === 'waived' ? 0 : shoot.totalPriceCents);

    const media = await this.db
      .select({
        photosMediaId: shootMedia.photosMediaId,
        transferredAt: shootMedia.transferredAt,
      })
      .from(shootMedia)
      .where(eq(shootMedia.shootId, shootId));

    let transferred = 0;
    const failures: Array<{ photosMediaId: number; error: string }> = [];

    if (shoot.clientUserId) {
      for (const m of media) {
        if (m.transferredAt) continue;
        try {
          await this.mediaService.transferOwnership(m.photosMediaId, shoot.clientUserId);
          transferred += 1;
        } catch (err) {
          failures.push({
            photosMediaId: m.photosMediaId,
            error: (err as Error).message,
          });
        }
      }
    }

    const [updated] = await this.db
      .update(shoots)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: opts.method,
        amountPaidCents,
        ...(opts.stripePaymentIntentId
          ? { stripePaymentIntentId: opts.stripePaymentIntentId }
          : {}),
      })
      .where(eq(shoots.id, shootId))
      .returning();

    return {
      shoot: updated,
      transferred,
      pendingClientLink: !shoot.clientUserId,
      failures,
    };
  }

  /**
   * Re-run the ownership transfer for a shoot that's already paid. Unlike
   * markPaid (which also flips status), this only moves media on
   * photos.mytrees.family. Target defaults to the shoot's linked client but
   * can be overridden — handy when the client links their mytrees account
   * after the original mark-paid left the media with the photographer.
   */
  async transfer(shootId: number, mytreesUserId: string, toMytreesUserId?: string) {
    await this.assertPhotographerOwns(shootId, mytreesUserId);

    const [shoot] = await this.db
      .select({
        id: shoots.id,
        status: shoots.status,
        clientUserId: clients.mytreesUserId,
      })
      .from(shoots)
      .innerJoin(clients, eq(shoots.clientId, clients.id))
      .where(eq(shoots.id, shootId))
      .limit(1);
    if (!shoot) throw new NotFoundException('Shoot not found');

    if (shoot.status !== 'paid') {
      throw new BadRequestException('Shoot must be marked paid before transfer');
    }

    const target = toMytreesUserId ?? shoot.clientUserId;
    if (!target) {
      throw new BadRequestException(
        'No transfer target — link the client\'s mytrees account or pass toMytreesUserId',
      );
    }

    const media = await this.db
      .select({
        photosMediaId: shootMedia.photosMediaId,
        transferredAt: shootMedia.transferredAt,
      })
      .from(shootMedia)
      .where(eq(shootMedia.shootId, shootId));

    let transferred = 0;
    let skipped = 0;
    const failures: Array<{ photosMediaId: number; error: string }> = [];

    for (const m of media) {
      if (m.transferredAt) {
        skipped += 1;
        continue;
      }
      try {
        await this.mediaService.transferOwnership(m.photosMediaId, target);
        transferred += 1;
      } catch (err) {
        failures.push({
          photosMediaId: m.photosMediaId,
          error: (err as Error).message,
        });
      }
    }

    return { shootId, target, transferred, skipped, failures };
  }
}
