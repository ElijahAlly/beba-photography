import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // rawBody: true preserves the unparsed request body so the Stripe webhook can
  // verify its signature (see PaymentsWebhookController).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api');

  // CORS: the frontend lives on a different host than the API (e.g.
  // beba.photography → api.beba.photography), so every browser request is
  // cross-origin and needs an explicit allow. FRONTEND_ORIGIN is a
  // comma-separated allowlist; we also accept any *subdomain* of a listed
  // origin so vanity studio subdomains (elijah.beba.photography) work without
  // listing each one. Trailing slashes are tolerated.
  const allowedOrigins = (
    process.env.FRONTEND_ORIGIN || 'http://localhost:3002,http://localhost:3000'
  )
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const hostnameOf = (origin: string): string => {
    try {
      return new URL(origin).hostname;
    } catch {
      return '';
    }
  };
  const allowedHosts = allowedOrigins.map(hostnameOf).filter(Boolean);

  app.enableCors({
    credentials: true,
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      // No Origin header = same-origin nav, curl, or server-to-server (Stripe).
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) return cb(null, true);
      const host = hostnameOf(origin);
      const ok = allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
      return cb(null, ok);
    },
  });

  const port = Number(process.env.BACKEND_PORT) || 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[beba-backend] listening on :${port}/api`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[beba-backend] failed to start:', err);
  process.exit(1);
});
