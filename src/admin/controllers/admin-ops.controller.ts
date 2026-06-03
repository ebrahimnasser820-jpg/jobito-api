import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AdminUserManagementService } from '../services/admin-user-management.service.js';
import { AdminCompanyReviewService } from '../services/admin-company-review.service.js';
import { AdminContentManagementService } from '../services/admin-content-management.service.js';
import { AdminTechnicalSupportService } from '../services/admin-technical-support.service.js';
import { AdminSystemRequestService } from '../services/admin-system-request.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from '../guards/admin-roles.guard.js';
import { AdminRolesAllowed } from '../decorators/admin-roles.decorator.js';
import { AdminRole } from '../entities/admin.entity.js';
import { UserActionDto } from '../dto/user-action.dto.js';
import { ReviewCompanyDto } from '../dto/review-company.dto.js';
import { ReviewContentDto, ReplyTicketDto } from '../dto/content-support.dto.js';
import { CreateSystemRequestDto } from '../dto/system-request.dto.js';
import { CurrentUser } from '../../common/decorators/user.decorator.js';

@Controller('admin/ops')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRolesAllowed(AdminRole.OPERATION_MANAGER, AdminRole.SUPER_ADMIN)
export class AdminOpsController {
  constructor(
    private userMgmtService: AdminUserManagementService,
    private companyReviewService: AdminCompanyReviewService,
    private contentService: AdminContentManagementService,
    private supportService: AdminTechnicalSupportService,
    private systemRequestService: AdminSystemRequestService,
  ) {}

  // ─── User Management ────────────────────────────────────────
  @Get('users')
  async listUsers(
    @Query('search') search?: string, @Query('accountType') accountType?: string,
    @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string,
  ) {
    return this.userMgmtService.listUsers(search, accountType, status, parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return this.userMgmtService.getUserDetails(id);
  }

  @Post('users/action')
  async executeUserAction(@CurrentUser() admin: any, @Body() dto: UserActionDto) {
    return this.userMgmtService.executeUserAction(admin.adminId, dto.targetUserId, dto.actionType, dto.reason);
  }

  @Patch('users/:id')
  async executeUserActionPatch(@CurrentUser() admin: any, @Param('id') id: string, @Body() body: { actionType: string, reason?: string }) {
    return this.userMgmtService.executeUserAction(admin.adminId, id, body.actionType as any, body.reason);
  }

  // ─── Company Review ──────────────────────────────────────────
  @Get('companies/pending')
  async getPendingCompanies() {
    console.log('--- ADMIN OPS: Fetching pending companies ---');
    return this.companyReviewService.getPendingCompanies();
  }

  @Get('companies/:id')
  async getCompanyDetails(@Param('id') id: string) {
    return this.companyReviewService.getCompanyDetails(parseInt(id));
  }

  @Post('companies/review')
  async reviewCompany(@CurrentUser() admin: any, @Body() dto: ReviewCompanyDto) {
    return this.companyReviewService.reviewCompany(admin.adminId, dto.companyId, dto.action as 'approve' | 'reject', dto.rejectionReason);
  }

  @Patch('companies/:id')
  async reviewCompanyPatch(@CurrentUser() admin: any, @Param('id') id: string, @Body() body: { action: 'approve' | 'reject', rejectionReason?: string }) {
    return this.companyReviewService.reviewCompany(admin.adminId, parseInt(id), body.action, body.rejectionReason);
  }

  @Get('companies')
  async listAllCompanies(@Query('status') status?: string) {
    console.log(`--- ADMIN OPS: Fetching all companies (status: ${status || 'all'}) ---`);
    return this.companyReviewService.listAllCompanies(status);
  }

  // ─── Content Management ──────────────────────────────────────
  @Get('content/reported')
  async getReportedContent(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.contentService.getReportedContent(status || 'pending', parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Post('content/review')
  async reviewContent(@CurrentUser() admin: any, @Body() dto: ReviewContentDto) {
    return this.contentService.reviewContent(admin.adminId, dto.reportId, dto.action as 'delete' | 'dismiss', dto.notifyViolation);
  }

  // ─── Technical Support ───────────────────────────────────────
  @Get('support/tickets')
  @Get('support') // Alias
  async listTickets(@Query('status') status?: string) {
    return this.supportService.listTickets(status);
  }

  @Get('support/tickets/:id')
  async getTicketMessages(@Param('id') id: string) {
    return this.supportService.getTicketMessages(parseInt(id));
  }

  @Post('support/tickets/:id/reply')
  async replyToTicket(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: ReplyTicketDto) {
    return this.supportService.replyToTicket(admin.adminId, parseInt(id), dto.content);
  }

  @Patch('support/tickets/:id/close')
  async closeTicket(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.supportService.closeTicket(admin.adminId, parseInt(id));
  }

  // ─── System Request (Ops Manager can create & view own) ─────────────────
  @Get('system-requests')
  async listMySystemRequests(@CurrentUser() admin: any) {
    return this.systemRequestService.listRequestsByRequester(admin.adminId);
  }

  @Post('system-request')
  async createSystemRequest(@CurrentUser() admin: any, @Body() dto: CreateSystemRequestDto) {
    return this.systemRequestService.createRequest(admin.adminId, dto);
  }

  // ─── Criminal Record Review ─────────────────────────────────────
  @Get('criminal-records')
  async getTradesmenCriminalRecords(@Query('status') status?: string) {
    return this.companyReviewService.getTradesmenWithCriminalRecords(status);
  }

  @Post('criminal-records/review')
  async reviewCriminalRecord(@CurrentUser() admin: any, @Body() body: { userId: string; action: 'approve' | 'reject'; reason?: string }) {
    return this.companyReviewService.reviewCriminalRecord(admin.adminId, body.userId, body.action, body.reason);
  }
}

