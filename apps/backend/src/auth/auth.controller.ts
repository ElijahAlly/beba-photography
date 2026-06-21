import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, OAUTH_STATE_COOKIE, SESSION_COOKIE } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { SessionUser } from '@cinderella/api-types';

/**
 * OAuth2 flow:
 *   GET /api/auth/login         → 302 to mytrees.family/oauth/authorize
 *   GET /api/auth/callback?code → exchange code, set session cookie, 302 home
 *   GET /api/auth/session       → returns current user (or null)
 *   POST /api/auth/logout       → clear session cookie
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('login')
  login(@Query('return_to') returnTo: string | undefined, @Res() res: Response) {
    const { state, verifier, challenge } = this.auth.newPkcePair();
    // Stash verifier + return_to in a short-lived cookie. JSON-encoded, httpOnly.
    const cookieValue = JSON.stringify({ state, verifier, returnTo: returnTo ?? '/' });
    res.cookie(OAUTH_STATE_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
    const url = this.auth.buildAuthorizationUrl({ state, codeChallenge: challenge });
    return res.redirect(302, url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (error) throw new BadRequestException(`OAuth error: ${error}`);
    if (!code || !state) throw new BadRequestException('code and state required');

    const raw = req.cookies?.[OAUTH_STATE_COOKIE];
    if (!raw) throw new BadRequestException('Missing OAuth state cookie (expired or denied?)');
    let pending: { state: string; verifier: string; returnTo: string };
    try {
      pending = JSON.parse(raw);
    } catch {
      throw new BadRequestException('Corrupt OAuth state cookie');
    }
    if (pending.state !== state) throw new BadRequestException('State mismatch');

    res.clearCookie(OAUTH_STATE_COOKIE);

    const tokens = await this.auth.exchangeCode(code, pending.verifier);
    const claims = await this.auth.verifyIdentityToken(tokens.access_token);
    await this.auth.upsertLocalUser({
      id: claims.userId,
      email: claims.email,
      displayName: claims.displayName,
    });
    // Single-tenant for now: every fresh sign-in claims a photographer
    // studio. Also relinks any clients-by-email that match this user.
    await this.auth.ensurePhotographerAndLinkClients({
      id: claims.userId,
      email: claims.email,
      displayName: claims.displayName,
    });

    // Stash the access token in an httpOnly cookie — the frontend never
    // sees it directly. The backend reads it on subsequent requests to
    // call photos.mytrees.family on behalf of the user.
    res.cookie(SESSION_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (tokens.expires_in || 3600) * 1000,
    });

    return res.redirect(302, pending.returnTo || '/');
  }

  @Get('session')
  async session(@Req() req: Request) {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return { authenticated: false, user: null };
    try {
      const claims = await this.auth.verifyIdentityToken(token);
      const user: SessionUser = {
        userId: claims.userId,
        email: claims.email,
        displayName: claims.displayName,
        scopes: claims.scope ? claims.scope.split(/\s+/).filter(Boolean) : [],
      };
      return { authenticated: true, user };
    } catch {
      return { authenticated: false, user: null };
    }
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(SESSION_COOKIE);
    return res.json({ ok: true });
  }

  // Protected sanity check
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: SessionUser) {
    return user;
  }
}
