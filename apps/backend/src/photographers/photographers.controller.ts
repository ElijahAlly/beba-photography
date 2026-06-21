import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUser } from '@cinderella/api-types';
import { PhotographersService } from './photographers.service.js';

class OnboardPhotographerDto {
  @IsString() @MinLength(1) @MaxLength(120) studioName!: string;
  @IsOptional() @IsString() @MaxLength(63) subdomain?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
}

class UpdatePhotographerDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) studioName?: string;
  @IsOptional() @IsString() @MaxLength(63) subdomain?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
}

/**
 * GET    /api/photographers/me  → caller's studio (or null)
 * POST   /api/photographers     → onboard (create the row shoots.create needs)
 * PATCH  /api/photographers/me  → edit studio profile
 */
@Controller('photographers')
@UseGuards(JwtAuthGuard)
export class PhotographersController {
  constructor(private readonly photographers: PhotographersService) {}

  @Get('me')
  me(@CurrentUser() user: SessionUser) {
    return this.photographers.me(user.userId);
  }

  @Post()
  onboard(@Body() body: OnboardPhotographerDto, @CurrentUser() user: SessionUser) {
    return this.photographers.onboard({
      mytreesUserId: user.userId,
      email: user.email,
      studioName: body.studioName,
      subdomain: body.subdomain,
      bio: body.bio,
    });
  }

  @Patch('me')
  update(@Body() body: UpdatePhotographerDto, @CurrentUser() user: SessionUser) {
    return this.photographers.update({ mytreesUserId: user.userId, ...body });
  }
}
