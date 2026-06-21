import { Module } from '@nestjs/common';
import { ShootsController } from './shoots.controller.js';
import { PaymentsWebhookController } from './payments-webhook.controller.js';
import { ShootsService } from './shoots.service.js';
import { MediaModule } from '../media/media.module.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [MediaModule, PaymentsModule],
  controllers: [ShootsController, PaymentsWebhookController],
  providers: [ShootsService],
})
export class ShootsModule {}
