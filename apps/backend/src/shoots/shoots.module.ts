import { Module } from '@nestjs/common';
import { ShootsController } from './shoots.controller.js';
import { ShootsService } from './shoots.service.js';
import { MediaModule } from '../media/media.module.js';

@Module({
  imports: [MediaModule],
  controllers: [ShootsController],
  providers: [ShootsService],
})
export class ShootsModule {}
