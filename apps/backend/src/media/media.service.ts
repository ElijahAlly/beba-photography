import {
  Inject,
  Injectable,
  BadGatewayException,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Readable } from 'stream';
import type { Response } from 'express';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module.js';
import { photographers, shootMedia, shoots } from '@cinderella/database';
import { and, eq } from 'drizzle-orm';

/**
 * Forwards uploads to photos.mytrees.family and records the returned
 * media id locally so we can render thumbnails and drive the
 * photographer→client ownership-transfer flow.
 */
@Injectable()
export class MediaService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private get baseUrl(): string {
    const u = process.env.PHOTOS_API_URL;
    if (!u) throw new Error('PHOTOS_API_URL not set');
    return u.replace(/\/$/, '');
  }

  private get apiKey(): string {
    const k = process.env.PHOTOS_API_KEY;
    if (!k) throw new Error('PHOTOS_API_KEY not set');
    return k;
  }

  /**
   * Guard for shoot-scoped media writes: confirms the shoot exists and that
   * the calling mytrees user is the photographer who owns it. Lives here (not
   * in ShootsService) so MediaModule stays free of a circular dependency on
   * ShootsModule. Throws NotFound/Forbidden; returns nothing on success.
   */
  async assertPhotographerOwnsShoot(shootId: number, mytreesUserId: string): Promise<void> {
    const [row] = await this.db
      .select({ photographerUserId: photographers.mytreesUserId })
      .from(shoots)
      .innerJoin(photographers, eq(shoots.photographerId, photographers.id))
      .where(eq(shoots.id, shootId))
      .limit(1);
    if (!row) throw new NotFoundException('Shoot not found');
    if (row.photographerUserId !== mytreesUserId) {
      throw new ForbiddenException('Not your shoot');
    }
  }

  /**
   * Upload one file on behalf of a photographer.
   * The photographer holds ownership until /shoots/:id/transfer fires.
   *
   * `file` is a Node `Blob` (Express/Multer's Buffer wrapped in one) so we
   * can build the FormData without dragging in extra deps.
   */
  async uploadForPhotographer(args: {
    photographerMytreesUserId: string;
    shootId: number;
    filename: string;
    contentType: string;
    data: Buffer;
  }) {
    const form = new FormData();
    // Node 22's Buffer is typed as Buffer<ArrayBufferLike>, but Blob wants
    // ArrayBuffer. Wrapping in Uint8Array narrows the underlying buffer type.
    const blob = new Blob([new Uint8Array(args.data)], { type: args.contentType });
    form.append('file', blob, args.filename);
    form.append('source', 'cinderella');
    form.append('sourceRef', `shoot:${args.shootId}`);

    const res = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        // photos.mytrees.family treats this as the photographerId, not the
        // owner, because we're sending source=cinderella.
        'x-on-behalf-of': args.photographerMytreesUserId,
      },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new BadGatewayException(`photos upload failed (${res.status}): ${text}`);
    }
    const payload = (await res.json()) as { success: boolean; media: { id: number; type: string; size: number; width: number | null; height: number | null } };
    if (!payload.success || !payload.media) {
      throw new BadGatewayException(`photos returned no media`);
    }

    const [row] = await this.db
      .insert(shootMedia)
      .values({
        shootId: args.shootId,
        photosMediaId: payload.media.id,
        filename: args.filename,
        type: payload.media.type,
        size: payload.media.size,
        width: payload.media.width,
        height: payload.media.height,
      })
      .returning();
    return row;
  }

  /**
   * Translate a local shoot_media id into the gpapics-side photosMediaId,
   * also acting as a sanity check that the media belongs to the given shoot.
   * Access control (is this user allowed to see the shoot?) is enforced by
   * the caller — usually ShootsService.getOneForUser.
   */
  async resolvePhotosMediaId(shootId: number, mediaId: number): Promise<number> {
    const [row] = await this.db
      .select({ photosMediaId: shootMedia.photosMediaId })
      .from(shootMedia)
      .where(and(eq(shootMedia.id, mediaId), eq(shootMedia.shootId, shootId)))
      .limit(1);
    if (!row) throw new NotFoundException('Media not found in this shoot');
    return row.photosMediaId;
  }

  /**
   * Proxy a GET request to gpapics with our service API key. Streams the
   * upstream response body straight through, preserving content-type and
   * length so thumbnails and raw downloads behave like static assets.
   */
  async streamFromPhotos(pathWithLeadingSlash: string, res: Response): Promise<StreamableFile> {
    const upstream = await fetch(`${this.baseUrl}${pathWithLeadingSlash}`, {
      headers: { 'x-api-key': this.apiKey },
    });
    if (!upstream.ok || !upstream.body) {
      throw new BadGatewayException(`photos fetch failed (${upstream.status})`);
    }
    const ct = upstream.headers.get('content-type');
    const cl = upstream.headers.get('content-length');
    const cd = upstream.headers.get('content-disposition');
    if (ct) res.setHeader('content-type', ct);
    if (cl) res.setHeader('content-length', cl);
    if (cd) res.setHeader('content-disposition', cd);
    res.setHeader('cache-control', 'private, max-age=300');
    return new StreamableFile(Readable.fromWeb(upstream.body as any));
  }

  /** Trigger the ownership transfer on photos.mytrees.family. */
  async transferOwnership(photosMediaId: number, toUserId: string) {
    const res = await fetch(`${this.baseUrl}/api/media/${photosMediaId}/transfer`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ toUserId }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new BadGatewayException(`transfer failed (${res.status}): ${text}`);
    }
    await this.db
      .update(shootMedia)
      .set({ transferredAt: new Date() })
      .where(eq(shootMedia.photosMediaId, photosMediaId));
    return await res.json();
  }
}
