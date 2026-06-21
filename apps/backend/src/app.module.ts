import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { DrizzleModule } from './drizzle/drizzle.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MediaModule } from './media/media.module.js';
import { ShootsModule } from './shoots/shoots.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { PhotographersModule } from './photographers/photographers.module.js';
import { MyModule } from './my/my.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { HealthController } from './health/health.controller.js';

// Look in the monorepo root first (pnpm runs each filter in its package's cwd,
// so apps/backend/.env wouldn't be found otherwise), then fall back to local.
const repoRootEnv = resolve(process.cwd(), '../../.env');
const localEnv = resolve(process.cwd(), '.env');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [localEnv, repoRootEnv] }),
    DrizzleModule,
    AuthModule,
    MediaModule,
    ShootsModule,
    ClientsModule,
    PhotographersModule,
    MyModule,
    PricingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
