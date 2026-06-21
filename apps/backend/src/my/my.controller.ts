import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUser } from '@cinderella/api-types';
import { MyService } from './my.service.js';

@Controller('my')
@UseGuards(JwtAuthGuard)
export class MyController {
  constructor(private readonly mine: MyService) {}

  @Get('shoots')
  shoots(@CurrentUser() user: SessionUser) {
    return this.mine.shoots(user.userId);
  }
}
