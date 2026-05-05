import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RatingsService } from './ratings.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createRatingDto: { companyId: number; targetUserId?: string; ratingValue: number; comment?: string; raterType?: string }, @Request() req) {
    return this.ratingsService.create(createRatingDto, req.user.userId);
  }

  @Get('company/:companyId')
  findByCompanyId(@Param('companyId') companyId: number) {
    return this.ratingsService.findByCompanyId(companyId);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.ratingsService.findByUserId(userId);
  }

  @Get('company/:companyId/given')
  findGivenByCompany(@Param('companyId') companyId: number) {
    return this.ratingsService.findGivenByCompany(companyId);
  }

  @Get('user/:userId/given')
  findGivenByUser(@Param('userId') userId: string) {
    return this.ratingsService.findGivenByUserId(userId);
  }
}
