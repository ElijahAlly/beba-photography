import { Module } from '@nestjs/common';
import { PhotographersController } from './photographers.controller.js';
import { PhotographersService } from './photographers.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [PhotographersController],
  providers: [PhotographersService],
})
export class PhotographersModule {}
