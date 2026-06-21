import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module.js';
import { clients, photographers, shoots } from '@cinderella/database';
import { desc, eq } from 'drizzle-orm';

/**
 * "My"-prefixed endpoints — what the currently-authenticated user can see
 * in their own capacity as a client (not as a photographer). Useful surface
 * for the client-facing gallery experience.
 */
@Injectable()
export class MyService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async shoots(mytreesUserId: string) {
    return this.db
      .select({
        id: shoots.id,
        title: shoots.title,
        status: shoots.status,
        scheduledFor: shoots.scheduledFor,
        location: shoots.location,
        paidAt: shoots.paidAt,
        totalPriceCents: shoots.totalPriceCents,
        createdAt: shoots.createdAt,
        photographerStudio: photographers.studioName,
        photographerEmail: photographers.email,
      })
      .from(shoots)
      .innerJoin(clients, eq(shoots.clientId, clients.id))
      .innerJoin(photographers, eq(shoots.photographerId, photographers.id))
      .where(eq(clients.mytreesUserId, mytreesUserId))
      .orderBy(desc(shoots.createdAt));
  }
}
