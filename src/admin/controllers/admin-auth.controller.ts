import { Controller, Post, Get, Body, Patch, UseGuards, Query, Param } from '@nestjs/common';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';
import { AdminSystemRequestService } from '../services/admin-system-request.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from '../guards/admin-roles.guard.js';
import { AdminRolesAllowed } from '../decorators/admin-roles.decorator.js';
import { AdminRole } from '../entities/admin.entity.js';
import { AdminLoginDto } from '../dto/admin-login.dto.js';
import { InviteAdminDto, CreateFirstAdminDto } from '../dto/invite-admin.dto.js';
import { ReviewSystemRequestDto } from '../dto/system-request.dto.js';
import { CurrentUser } from '../../common/decorators/user.decorator.js';

@Controller('admin')
export class AdminAuthController {
  constructor(
    private authService: AdminAuthService,
    private dashboardService: AdminDashboardService,
    private systemRequestService: AdminSystemRequestService,
  ) {}

  // ─── Public: Setup & Login ────────────────────────────────────

  @Post('setup')
  async setupFirstAdmin(@Body() dto: CreateFirstAdminDto) {
    return this.authService.setupFirstAdmin(dto.fullName, dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  // ─── Super Admin: Dashboard ──────────────────────────────────

  @Get('dashboard/stats')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async getSystemStats() {
    return this.dashboardService.getSystemStats();
  }

  @Get('dashboard/charts')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async getWeeklyChartData() {
    return this.dashboardService.getWeeklyChartData();
  }

  // ─── Super Admin: Maintenance Mode ────────────────────────────

  @Get('maintenance')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async getMaintenanceStatus() {
    return this.dashboardService.getMaintenanceStatus();
  }

  @Patch('maintenance')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async toggleMaintenance(@Body('enabled') enabled: boolean) {
    return this.dashboardService.setMaintenanceMode(enabled);
  }

  // ─── Super Admin: Admin Management ────────────────────────────

  @Post('invite')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async inviteAdmin(@CurrentUser() admin: any, @Body() dto: InviteAdminDto) {
    return this.authService.inviteAdmin(admin.adminId, dto.fullName, dto.email, dto.role, dto.password);
  }

  @Get('list')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async listAdmins() {
    return this.authService.listAdmins();
  }

  // ─── Super Admin: Activity Log ────────────────────────────────

  @Get('activity-log')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async getActivityLog(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.authService.getActivityLogs(parseInt(page || '1'), parseInt(limit || '20'));
  }

  // ─── Super Admin: Review System Requests ──────────────────────

  @Get('system-requests')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async listSystemRequests(@Query('status') status?: string) {
    return this.systemRequestService.listRequests(status);
  }

  @Patch('system-requests/:id')
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRolesAllowed(AdminRole.SUPER_ADMIN)
  async reviewSystemRequest(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: ReviewSystemRequestDto) {
    return this.systemRequestService.reviewRequest(admin.adminId, parseInt(id), dto.action as 'approve' | 'reject', dto.reviewNote);
  }

  // ─── Shared: Profile ─────────────────────────────────────────

  @Get('profile')
  @UseGuards(AdminJwtAuthGuard)
  async getProfile(@CurrentUser() admin: any) {
    return this.authService.getProfile(admin.adminId);
  }

  @Patch('change-password')
  @UseGuards(AdminJwtAuthGuard)
  async changePassword(@CurrentUser() admin: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.authService.changePassword(admin.adminId, body.oldPassword, body.newPassword);
  }
}
