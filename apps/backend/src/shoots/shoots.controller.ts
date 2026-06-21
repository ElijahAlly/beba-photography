import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUser } from '@cinderella/api-types';
import { ShootsService } from './shoots.service.js';
import { MediaService } from '../media/media.service.js';

class CreateShootDto {
  @IsInt() @Min(1) clientId!: number;
  @IsString() @MaxLength(120) title!: string;
  @IsOptional() @IsString() scheduledFor?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsInt() totalPriceCents?: number;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

class TransferShootDto {
  // Optional override. When omitted, ownership flips to the shoot's linked
  // client (clients.mytreesUserId). Useful when the client links their
  // mytrees account after payment and the photographer re-runs the transfer.
  @IsOptional() @IsString() @MaxLength(64) toMytreesUserId?: string;
}

@Controller('shoots')
@UseGuards(JwtAuthGuard)
export class ShootsController {
  constructor(
    private readonly shoots: ShootsService,
    private readonly media: MediaService,
  ) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.shoots.listForPhotographer(user.userId);
  }

  @Post()
  create(@Body() body: CreateShootDto, @CurrentUser() user: SessionUser) {
    return this.shoots.create({ ...body, mytreesUserId: user.userId });
  }

  @Get(':id')
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SessionUser,
  ) {
    return this.shoots.getOneForUser(id, user.userId);
  }

  @Get(':id/media')
  listMedia(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SessionUser,
  ) {
    return this.shoots.listMedia(id, user.userId);
  }

  @Post(':id/mark-paid')
  markPaid(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SessionUser,
  ) {
    return this.shoots.markPaid(id, user.userId);
  }

  /**
   * Flip ownership of every file in a *paid* shoot on photos.mytrees.family.
   * Idempotent — already-transferred media is skipped, so it's safe to re-run
   * once a client links their mytrees account.
   */
  @Post(':id/transfer')
  transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: TransferShootDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.shoots.transfer(id, user.userId, body.toMytreesUserId);
  }

  @Get(':shootId/media/:mediaId/thumb')
  async thumb(
    @Param('shootId', ParseIntPipe) shootId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @CurrentUser() user: SessionUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.shoots.getOneForUser(shootId, user.userId);
    const photosMediaId = await this.media.resolvePhotosMediaId(shootId, mediaId);
    return this.media.streamFromPhotos(`/api/media/${photosMediaId}/thumb`, res);
  }

  @Get(':shootId/media/:mediaId/raw')
  async raw(
    @Param('shootId', ParseIntPipe) shootId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @CurrentUser() user: SessionUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.shoots.getOneForUser(shootId, user.userId);
    const photosMediaId = await this.media.resolvePhotosMediaId(shootId, mediaId);
    return this.media.streamFromPhotos(`/api/media/${photosMediaId}/raw`, res);
  }
}
