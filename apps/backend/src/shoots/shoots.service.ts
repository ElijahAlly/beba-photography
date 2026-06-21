import {
  Inject,
  Injectable,
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

@Injectable()
export class ShootsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly mediaService: MediaService,
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
        paidAt: shoots.paidAt,
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
   * Photographer marks a shoot as paid. Updates status + paid_at and fires
   * the ownership transfer for every piece of media to the client's mytrees
   * user (if linked). Media without a linked client stays with the
   * photographer until the client signs in for the first time, at which
   * point the photographer can re-run mark-paid.
   */
  async markPaid(shootId: number, mytreesUserId: string) {
    await this.assertPhotographerOwns(shootId, mytreesUserId);

    const [shoot] = await this.db
      .select({
        id: shoots.id,
        paidAt: shoots.paidAt,
        clientUserId: clients.mytreesUserId,
      })
      .from(shoots)
      .innerJoin(clients, eq(shoots.clientId, clients.id))
      .where(eq(shoots.id, shootId))
      .limit(1);
    if (!shoot) throw new NotFoundException('Shoot not found');

    const media = await this.db
      .select({
        id: shootMedia.id,
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
          await this.mediaService.transferOwnership(
            m.photosMediaId,
            shoot.clientUserId,
          );
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
      .set({ status: 'paid', paidAt: new Date() })
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
