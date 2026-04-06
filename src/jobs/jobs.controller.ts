import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { CompaniesService } from '../companies/companies.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { FilterJobsDto } from './dto/filter-jobs.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('jobs')
export class JobsController {
  constructor(
    private jobsService: JobsService,
    private companiesService: CompaniesService,
  ) {}

  @Get('seed-categories')
  async seedCategories() {
    return this.jobsService.seedCategories();
  }

  @Get('categories')
  async findAllCategories() {
    return await this.jobsService.findAllCategories();
  }

  @Get()
  findAll(@Query() filters: FilterJobsDto) {
    return this.jobsService.findAll(filters);
  }

  @Get('nearby')
  async getNearbyJobs(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radius') radius: string,
  ) {
    return this.jobsService.getNearbyJobs(
      parseFloat(lon),
      parseFloat(lat),
      radius ? parseInt(radius) : 10000,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }

  @Get('similar/:id')
  async getSimilarJobs(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.getSimilarJobs(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async create(@Body() dto: CreateJobDto, @Req() req: any) {
    const user = req.user as any;
    const userEmail = user.email;
    const company = await this.companiesService.findByContactEmailOrName(userEmail);
    if (!company) {
      throw new NotFoundException(
        'Associated company profile not found for this user',
      );
    }
    // Override the companyId with the authentic user's company
    dto.companyId = company.companyId;

    if (dto.benefits) {
      await this.companiesService.update(company.companyId, {
        benefits: dto.benefits,
      });
      delete dto.benefits;
    }

    return this.jobsService.create(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async createBulk(@Body() dto: CreateJobDto[], @Req() req: any) {
    const userEmail = req.user.email;
    const company = await this.companiesService.findByContactEmailOrName(userEmail);
    if (!company) {
      throw new NotFoundException('Associated company profile not found for this user');
    }
    // Override the company_id for all jobs
    dto.forEach((job) => (job.companyId = company.companyId));
    return this.jobsService.createBulk(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
    @Req() req: any,
  ) {
    const user = req.user as any;
    const userEmail = user.email;
    const company = await this.companiesService.findByContactEmailOrName(userEmail);
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const job = await this.jobsService.findOne(id);
    if (Number(job.companyId) !== Number(company.companyId)) {
      throw new ForbiddenException('You are not authorized to edit this job');
    }

    if (dto.benefits) {
      await this.companiesService.update(company.companyId, {
        benefits: dto.benefits,
      });
      delete dto.benefits;
    }

    return this.jobsService.update(id, dto);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  async recordView(
    @Param('id', ParseIntPipe) id: number,
    @Body('sessionId') sessionId: string,
    @Req() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id; 
    console.log(`[JobsController] 📈 Recording view for Job #${id} by User ${userId}`);
    return this.jobsService.recordView(id, userId, sessionId);
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async getAnalytics(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userEmail = req.user.email;
    const company = await this.companiesService.findByContactEmailOrName(userEmail);
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const job = await this.jobsService.findOne(id);
    if (Number(job.companyId) !== Number(company.companyId)) {
      throw new ForbiddenException('You are not authorized to view analytics for this job');
    }

    return this.jobsService.getJobAnalytics(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user as any;
    const userEmail = user.email;
    const company = await this.companiesService.findByContactEmailOrName(userEmail);
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const job = await this.jobsService.findOne(id);
    if (Number(job.companyId) !== Number(company.companyId)) {
      throw new ForbiddenException('You are not authorized to delete this job');
    }

    return this.jobsService.remove(id);
  }
}
