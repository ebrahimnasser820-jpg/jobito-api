import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AdminDashboardService } from './admin/services/admin-dashboard.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('') // Adding a new endpoint for the root path
  getRoot() {
    return { message: 'API is working' };
  }

  @Get('config')
  getPublicConfig() {
    return {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      maintenanceMode: AdminDashboardService.maintenanceMode,
    };
  }

  @Get('maintenance-status')
  getMaintenanceStatus() {
    return {
      maintenanceMode: AdminDashboardService.maintenanceMode,
      message: AdminDashboardService.maintenanceMode
        ? 'The system is currently undergoing maintenance. Please try again later.'
        : 'System is operational.',
    };
  }
}
