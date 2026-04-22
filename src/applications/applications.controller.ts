import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
    ParseIntPipe,
    Delete,
    Patch,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AccountDeletionGuard } from '../common/guards/account-deletion.guard.js';
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
  @UseGuards(RolesGuard, AccountDeletionGuard)
  @Roles('student')
  apply(
    @Body('job_id') jobId: number,
    @Body('portfolioUrl') portfolioUrl: string,
    @Body('address') address: string,
    @Body('coverLetter') coverLetter: string,
    @Body('resumeUrl') resumeUrl: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.applicationsService.apply(user.sub, jobId, { portfolioUrl, address, coverLetter, resumeUrl });
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('student')
  getMyApplications(@CurrentUser() user: RequestUser) {
    return this.applicationsService.getMyApplications(user.sub);
  }

  @Get('job/:jobId')
  @UseGuards(RolesGuard)
  @Roles('company', 'student')
  getJobApplications(
    @Param('jobId', ParseIntPipe) jobId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.applicationsService.getJobApplications(jobId, user.sub, user.role || "");
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('company', 'student')
  async getApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    const app = await this.applicationsService.findOne(id, user.sub, user.role || "");
    if (!app) {
      throw new Error('Application not found');
    }
    return app;
  }

  @Patch(':id/status')
  @Post(':id/status') // Support both for robustness
  @UseGuards(RolesGuard)
  @Roles('company', 'student')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @CurrentUser() user: RequestUser,
  ) {
    console.log(`📥 [Controller] updateStatus for ID: ${id}, Status: ${status}, User: ${user.sub}`);
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
  @Roles('company', 'student')
  deleteApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.applicationsService.deleteApplication(id, user.sub);
  }
}
