import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module.js';
import { clients, mytreesUsers, photographers, shoots } from '@cinderella/database';
import { and, desc, eq } from 'drizzle-orm';

@Injectable()
export class ClientsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private async photographerByUserId(mytreesUserId: string) {
    const [row] = await this.db
      .select()
      .from(photographers)
      .where(eq(photographers.mytreesUserId, mytreesUserId))
      .limit(1);
    if (!row)
      throw new ForbiddenException('Not a photographer — register a studio first');
    return row;
  }

  async list(mytreesUserId: string) {
    const photographer = await this.photographerByUserId(mytreesUserId);
    return this.db
      .select()
      .from(clients)
      .where(eq(clients.photographerId, photographer.id))
      .orderBy(desc(clients.createdAt));
  }

  async getOne(clientId: number, mytreesUserId: string) {
    const photographer = await this.photographerByUserId(mytreesUserId);
    const [client] = await this.db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.photographerId, photographer.id)))
      .limit(1);
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(args: {
    mytreesUserId: string;
    email: string;
    name: string;
    phone?: string;
    notes?: string;
  }) {
    const photographer = await this.photographerByUserId(args.mytreesUserId);
    const email = args.email.toLowerCase().trim();

    // Reject duplicates for this photographer — collapsing two records for
    // the same human is a manual operation, not something we should do
    // silently.
    const [existing] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.photographerId, photographer.id), eq(clients.email, email)))
      .limit(1);
    if (existing) {
      throw new ConflictException('A client with this email already exists');
    }

    // If this email belongs to a mytrees user we've already seen, link it
    // so the client can sign in and see their shoot without extra setup.
    const [knownUser] = await this.db
      .select({ id: mytreesUsers.id })
      .from(mytreesUsers)
      .where(eq(mytreesUsers.email, email))
      .limit(1);

    const [row] = await this.db
      .insert(clients)
      .values({
        photographerId: photographer.id,
        email,
        name: args.name,
        phone: args.phone ?? null,
        notes: args.notes ?? null,
        mytreesUserId: knownUser?.id ?? null,
      })
      .returning();
    return row;
  }

  async listShoots(clientId: number, mytreesUserId: string) {
    await this.getOne(clientId, mytreesUserId); // access check
    return this.db
      .select()
      .from(shoots)
      .where(eq(shoots.clientId, clientId))
      .orderBy(desc(shoots.createdAt));
  }
}
