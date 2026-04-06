import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardPayloadDto } from './dto/dashboard-payload.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard'; // Assuming Role checking
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard) // Protect all dashboard routes
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('stats')
  // @Roles('COMPANY')
  async getStats(@Body() payload: DashboardPayloadDto) {
    // In a real scenario, NestJS might fetch the user's jobs/applicants from TypeORM here
    // and construct the payload, instead of letting the frontend send it.
    // For now, it passes the payload to the .NET Analytics Engine.
    return this.dashboardService.getDashboardStats(payload);
  }

  @Post('applicants-summary')
  // @Roles('COMPANY')
  async getApplicantSummary(@Body() payload: DashboardPayloadDto) {
    return this.dashboardService.getApplicantSummary(payload);
  }

  @Post('job-updates')
  // @Roles('COMPANY')
  async getJobUpdates(@Body() payload: DashboardPayloadDto) {
    return this.dashboardService.getJobUpdates(payload);
  }

  @Post('job-listing-stats')
  // @Roles('COMPANY')
  async getJobListingStats(@Body() payload: DashboardPayloadDto) {
    return this.dashboardService.getJobListingStats(payload);
  }
}
