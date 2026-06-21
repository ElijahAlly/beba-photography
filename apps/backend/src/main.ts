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

  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: frontendOrigin.split(',').map((s) => s.trim()),
    credentials: true,
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
