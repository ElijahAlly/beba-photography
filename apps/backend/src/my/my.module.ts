import { Module } from '@nestjs/common';
import { MyController } from './my.controller.js';
import { MyService } from './my.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [MyController],
  providers: [MyService],
})
export class MyModule {}
