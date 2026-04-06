import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
  NotFoundException,
  Request,
} from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserOwnsCompanyGuard } from '../common/guards/user-owns-company.guard.js';

import { FilterCompaniesDto } from './dto/filter-companies.dto.js';

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  findAll(@Query() filters: FilterCompaniesDto) {
    return this.companiesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async create(@Body() dto: CreateCompanyDto) {
    try {
      return await this.companiesService.create(dto);
    } catch (err) {
      console.error('Error creating company:', err);
      throw err;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, UserOwnsCompanyGuard)
  @Roles('company')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
  ) {
    try {
      return await this.companiesService.update(id, dto);
    } catch (err) {
      console.error('Error updating company:', err);
      throw err;
    }
  }

  @Get('my/dashboard-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async getMyDashboardSummary(@Req() req: Request & { user: any }) {
    const userEmail = req.user.email;
    const company = await this.companiesService.findByContactEmailOrName(
      userEmail as string,
    );
    if (!company) {
      throw new NotFoundException(
        'Associated company profile not found for this user',
      );
    }
    return this.companiesService.getDashboardSummary(company.companyId);
  }

  @Get('my/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async getMyProfile(@Req() req: Request & { user: any }) {
    const userEmail = req.user.email;
    const company = await this.companiesService.findByContactEmailOrName(
      userEmail as string,
    );
    if (!company) {
      throw new NotFoundException(
        'Associated company profile not found for this user',
      );
    }
    return company;
  }

  @Patch('my/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  async updateMyProfile(
    @Req() req: Request & { user: any },
    @Body() body: any,
  ) {
    const userEmail = req.user.email;
    const company = await this.companiesService.findByContactEmailOrName(
      userEmail as string,
    );

    // Mapping frontend fields to backend DTO/Entity
    const updateDto: CreateCompanyDto & UpdateCompanyDto = {
      name: body.name || req.user?.name || 'My Company',
      website: body.website,
      industry: body.industry,
      classification: body.classification,
      description: body.description,
      address: body.address,
      employees: body.employees,
      contactEmail: body.email || userEmail,
      phone: body.phone,
      logoUrl: body.logo,
      locationTags: body.locationTags,
      techStack: body.techStack,
      socialLinks: body.socialLinks || {
        linkedin: body.linkedin,
        twitter: body.twitter,
        facebook: body.facebook,
      },
    };

    // Handle foundedDate -> Day/Month/Year
    if (body.foundedDate) {
      const date = new Date(body.foundedDate);
      updateDto.foundedDay = String(date.getDate());
      updateDto.foundedMonth = String(date.getMonth() + 1);
      updateDto.foundedYear = String(date.getFullYear());
    }

    // Handle benefits (string or CSV -> Array)
    if (body.benefits) {
      if (typeof body.benefits === 'string') {
        updateDto.benefits = body.benefits.split(',').map((s: string) => s.trim()).filter(Boolean);
      } else {
        updateDto.benefits = body.benefits;
      }
    }

    if (!company) {
      // Auto-create if not found
      return this.companiesService.create(updateDto);
    }

    return this.companiesService.update(company.companyId, updateDto);
  }

  @Get('dev/cleanup')
  @UseGuards(JwtAuthGuard)
  async cleanup() {
    // This is a dev-only route to fix the user's data issues
    const response = await this.companiesService.findAll({});
    const companies = response.data || [];
    const seen = new Set<string>();
    const toDelete: number[] = [];
    const toUpdate: { id: number; description: string }[] = [];

    companies.forEach((c: any) => {
      const companyName = String(c.name || '').toLowerCase();
      const contactEmail = String(c.contactEmail || '').toLowerCase();
      const key = `${companyName}-${contactEmail}`;
      if (seen.has(key)) {
        toDelete.push(Number(c.companyId));
      } else {
        seen.add(key);
        const desc = String(c.description || '');
        if (desc.includes('figmeta') || desc.includes('figma')) {
          toUpdate.push({
            id: Number(c.companyId),
            description: 'Leading company in their field.',
          });
        }
      }
    });

    for (const id of toDelete) {
      await (this.companiesService as any).repo.delete(id);
    }

    for (const upd of toUpdate) {
      await this.companiesService.update(upd.id, {
        description: upd.description,
      });
    }

    return {
      message: 'Cleanup completed',
      deleted: toDelete.length,
      updated: toUpdate.length,
    };
  }

  @Get(':id/statistics')
  getStatistics(
    @Param('id', ParseIntPipe) id: number,
    @Query('period') period?: string,
  ) {
    return this.companiesService.getStatistics(id, period);
  }
}
