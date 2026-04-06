import { Controller, Post, Get, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { FavoritesService } from './favorites.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle/:jobId')
  async toggle(@Req() req, @Param('jobId', ParseIntPipe) jobId: number) {
    return this.favoritesService.toggleFavorite(req.user.userId, jobId);
  }

  @Get()
  async getFavorites(@Req() req) {
    return this.favoritesService.getUserFavorites(req.user.userId);
  }
}
