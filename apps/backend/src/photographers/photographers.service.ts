import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module.js';
import { photographers } from '@cinderella/database';
import { and, eq, ne } from 'drizzle-orm';

/**
 * Photographer (studio) onboarding + profile. A photographers row is the
 * prerequisite for shoots.create — without it the user is "not a
 * photographer". Sign-in auto-creates one (see AuthService), but this module
 * lets a user create/inspect/edit the studio explicitly.
 */
@Injectable()
export class PhotographersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private slugify(input: string): string {
    return (
      input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/^-+|-+$/g, '') || 'studio'
    );
  }

  private async byUserId(mytreesUserId: string) {
    const [row] = await this.db
      .select()
      .from(photographers)
      .where(eq(photographers.mytreesUserId, mytreesUserId))
      .limit(1);
    return row ?? null;
  }

  /** The caller's studio, or null if they haven't onboarded. */
  async me(mytreesUserId: string) {
    return this.byUserId(mytreesUserId);
  }

  /** Ensure a subdomain is free (optionally ignoring the caller's own row). */
  private async assertSubdomainFree(subdomain: string, exceptUserId?: string) {
    const [taken] = await this.db
      .select({ id: photographers.id })
      .from(photographers)
      .where(
        exceptUserId
          ? and(
              eq(photographers.subdomain, subdomain),
              ne(photographers.mytreesUserId, exceptUserId),
            )
          : eq(photographers.subdomain, subdomain),
      )
      .limit(1);
    if (taken) throw new ConflictException(`Subdomain "${subdomain}" is taken`);
  }

  /**
   * Onboard the current user as a photographer. Idempotent: if they already
   * have a studio, the provided fields update it instead of erroring.
   */
  async onboard(args: {
    mytreesUserId: string;
    email: string;
    studioName: string;
    subdomain?: string;
    bio?: string;
  }) {
    const existing = await this.byUserId(args.mytreesUserId);
    const subdomain = this.slugify(
      args.subdomain || args.studioName || args.email.split('@')[0] || 'studio',
    );

    if (existing) {
      await this.assertSubdomainFree(subdomain, args.mytreesUserId);
      const [row] = await this.db
        .update(photographers)
        .set({
          studioName: args.studioName,
          subdomain,
          bio: args.bio ?? existing.bio,
        })
        .where(eq(photographers.mytreesUserId, args.mytreesUserId))
        .returning();
      return row;
    }

    await this.assertSubdomainFree(subdomain);
    const [row] = await this.db
      .insert(photographers)
      .values({
        mytreesUserId: args.mytreesUserId,
        email: args.email,
        studioName: args.studioName,
        subdomain,
        bio: args.bio ?? null,
      })
      .returning();
    return row;
  }

  /** Edit the caller's studio profile. */
  async update(args: {
    mytreesUserId: string;
    studioName?: string;
    subdomain?: string;
    bio?: string;
  }) {
    const existing = await this.byUserId(args.mytreesUserId);
    if (!existing) {
      throw new NotFoundException('No studio yet — onboard first');
    }

    const subdomain =
      args.subdomain !== undefined ? this.slugify(args.subdomain) : existing.subdomain;
    if (subdomain !== existing.subdomain) {
      await this.assertSubdomainFree(subdomain, args.mytreesUserId);
    }

    const [row] = await this.db
      .update(photographers)
      .set({
        studioName: args.studioName ?? existing.studioName,
        subdomain,
        bio: args.bio ?? existing.bio,
      })
      .where(eq(photographers.mytreesUserId, args.mytreesUserId))
      .returning();
    return row;
  }
}
