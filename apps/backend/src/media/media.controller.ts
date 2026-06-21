import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUser } from '@cinderella/api-types';
import { MediaService } from './media.service.js';

/**
 * Endpoints intentionally scoped to a shoot — there's no "raw" upload here.
 * Every byte that lands on photos.mytrees.family is tied to a shoot the
 * authenticated photographer owns.
 */
@Controller('shoots/:shootId/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('shootId', ParseIntPipe) shootId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: SessionUser,
  ) {
    if (!file) throw new BadRequestException('file required');
    // Only the photographer who owns the shoot may push bytes into it.
    await this.media.assertPhotographerOwnsShoot(shootId, user.userId);
    return this.media.uploadForPhotographer({
      photographerMytreesUserId: user.userId,
      shootId,
      filename: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
    });
  }
}
