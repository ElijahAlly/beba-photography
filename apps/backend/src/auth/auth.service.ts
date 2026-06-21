import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module.js';
import { clients, mytreesUsers, photographers } from '@cinderella/database';
import { eq, isNull, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

/**
 * Cookie used to track which PKCE verifier + state belong to the in-flight
 * authorization request. Set by /api/auth/login, consumed by /api/auth/callback.
 */
export const OAUTH_STATE_COOKIE = 'cinderella_oauth_state';
export const SESSION_COOKIE = 'cinderella_session';

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface IdpUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Build the authorization URL the browser should navigate to. */
  buildAuthorizationUrl(opts: { state: string; codeChallenge: string }): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.requireEnv('OAUTH_CLIENT_ID'),
      redirect_uri: this.requireEnv('OAUTH_REDIRECT_URI'),
      scope: process.env.OAUTH_SCOPES || 'profile photos:read photos:write',
      state: opts.state,
      code_challenge: opts.codeChallenge,
      code_challenge_method: 'S256',
    });
    return `${this.requireEnv('IDP_AUTHORIZE_URL')}?${params.toString()}`;
  }

  /** Generate a (state, verifier, challenge) triple for the PKCE flow. */
  newPkcePair() {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const state = randomBytes(16).toString('base64url');
    return { state, verifier, challenge };
  }

  /** Exchange an authorization code for tokens at mytrees.family. */
  async exchangeCode(code: string, codeVerifier: string): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.requireEnv('OAUTH_REDIRECT_URI'),
      client_id: this.requireEnv('OAUTH_CLIENT_ID'),
      client_secret: this.requireEnv('OAUTH_CLIENT_SECRET'),
      code_verifier: codeVerifier,
    });

    const res = await fetch(this.requireEnv('IDP_TOKEN_URL'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new BadRequestException(`Token exchange failed (${res.status}): ${text}`);
    }
    return (await res.json()) as OAuthTokenResponse;
  }

  /** Decode the access token (no signature check — see verifyIdentityToken for that). */
  async verifyIdentityToken(token: string): Promise<{ userId: string; email: string; displayName?: string; scope?: string }> {
    const secret = new TextEncoder().encode(this.requireEnv('JWT_SECRET'));
    try {
      const { payload } = await jwtVerify(token, secret);
      if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
        throw new UnauthorizedException('Token missing required claims');
      }
      return {
        userId: payload.userId,
        email: payload.email,
        displayName: (payload.displayName as string) || undefined,
        scope: (payload.scope as string) || undefined,
      };
    } catch (err) {
      throw new UnauthorizedException(`Invalid identity token: ${(err as Error).message}`);
    }
  }

  /** Fetch user info from mytrees.family using the access token. */
  async fetchUserInfo(accessToken: string): Promise<IdpUserInfo> {
    const res = await fetch(this.requireEnv('IDP_USERINFO_URL'), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException(`UserInfo failed (${res.status})`);
    return (await res.json()) as IdpUserInfo;
  }

  /** Cache a user we've seen so we can join locally. */
  async upsertLocalUser(args: { id: string; email: string; displayName?: string }) {
    await this.db
      .insert(mytreesUsers)
      .values({
        id: args.id,
        email: args.email,
        displayName: args.displayName ?? null,
      })
      .onConflictDoUpdate({
        target: mytreesUsers.id,
        set: {
          email: args.email,
          displayName: args.displayName ?? null,
          lastSeenAt: new Date(),
        },
      });
  }

  /**
   * First-sign-in plumbing — we're single-tenant for now, so every fresh
   * mytrees user becomes a photographer automatically. Also back-fills the
   * mytreesUserId on any pre-existing client rows that share the email, so
   * a photographer who created a client by-email earlier sees the link
   * when that client actually shows up.
   */
  async ensurePhotographerAndLinkClients(args: { id: string; email: string; displayName?: string }) {
    const [existing] = await this.db
      .select({ id: photographers.id })
      .from(photographers)
      .where(eq(photographers.mytreesUserId, args.id))
      .limit(1);

    if (!existing) {
      const localPart = args.email.split('@')[0] || 'studio';
      const subdomain = localPart.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'studio';
      const studioName = args.displayName?.trim() || localPart;
      try {
        await this.db.insert(photographers).values({
          mytreesUserId: args.id,
          email: args.email,
          studioName,
          subdomain,
        });
      } catch {
        // Subdomain collision — fall back to mytrees user id suffix. This
        // path is unreachable in single-photographer dev but cheap insurance.
        await this.db.insert(photographers).values({
          mytreesUserId: args.id,
          email: args.email,
          studioName,
          subdomain: `${subdomain}-${args.id.slice(0, 6)}`,
        });
      }
    }

    // Back-link any clients the photographer added by email before this user
    // had a mytrees account.
    await this.db
      .update(clients)
      .set({ mytreesUserId: args.id })
      .where(and(eq(clients.email, args.email), isNull(clients.mytreesUserId)));
  }

  private requireEnv(key: string): string {
    const v = process.env[key];
    if (!v) throw new Error(`Missing required env var: ${key}`);
    return v;
  }
}
