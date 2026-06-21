import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { SESSION_COOKIE } from '../auth.service.js';
import type { SessionUser } from '@cinderella/api-types';

/**
 * Pulls the mytrees-issued access token from the session cookie and
 * verifies it against the shared JWT_SECRET. The plain passport-jwt
 * extractor doesn't understand cookies, so we provide our own.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Fail loud: a default like 'change-me' would silently accept any
      // attacker-signed token in environments where JWT_SECRET is missing.
      throw new Error('JWT_SECRET must be set (shared with mytrees.family)');
    }
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.[SESSION_COOKIE] || null,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any): Promise<SessionUser> {
    if (!payload?.userId || !payload?.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.userId,
      email: payload.email,
      displayName: payload.displayName,
      scopes: payload.scope ? String(payload.scope).split(/\s+/).filter(Boolean) : [],
    };
  }
}
