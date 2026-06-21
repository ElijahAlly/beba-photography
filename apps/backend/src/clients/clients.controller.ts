import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUser } from '@cinderella/api-types';
import { ClientsService } from './clients.service.js';

class CreateClientDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) @MaxLength(200) name!: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.clients.list(user.userId);
  }

  @Post()
  create(@Body() body: CreateClientDto, @CurrentUser() user: SessionUser) {
    return this.clients.create({ ...body, mytreesUserId: user.userId });
  }

  @Get(':id')
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SessionUser,
  ) {
    return this.clients.getOne(id, user.userId);
  }

  @Get(':id/shoots')
  listShoots(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SessionUser,
  ) {
    return this.clients.listShoots(id, user.userId);
  }
}
