import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
    ParseIntPipe,
    Delete,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/user.decorator.js';

interface RequestUser {
  sub: string;
  userId?: string;
  role?: string;
  email?: string;
}

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('student')
  apply(
    @Body('job_id') jobId: number,
    @Body('portfolioUrl') portfolioUrl: string,
    @Body('coverLetter') coverLetter: string,
    @Body('resumeUrl') resumeUrl: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.applicationsService.apply(user.sub, jobId, { portfolioUrl, coverLetter, resumeUrl });
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('student')
  getMyApplications(@CurrentUser() user: RequestUser) {
    return this.applicationsService.getMyApplications(user.sub);
  }

  @Get('job/:jobId')
  @UseGuards(RolesGuard)
  @Roles('company')
  getJobApplications(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.applicationsService.getJobApplications(jobId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('company')
  async getApplication(@Param('id', ParseIntPipe) id: number) {
    const app = await this.applicationsService.findOne(id);
    if (!app) {
      throw new Error('Application not found');
    }
    return app;
  }

  @Post(':id/status')
  @UseGuards(RolesGuard)
  @Roles('company')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.applicationsService.updateStatus(id, status, user.sub);
  }

  @Get('status/:jobId')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getStatusByJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @CurrentUser() user: RequestUser,
  ) {
    const userId = user.userId || user.sub;
    const application = await this.applicationsService.getUserApplicationForJob(userId, jobId);
    return application || null;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('company')
  deleteApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.applicationsService.deleteApplication(id, user.sub);
  }
}
