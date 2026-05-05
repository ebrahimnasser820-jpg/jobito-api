import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

// Entities
import { Admin } from './entities/admin.entity.js';
import { AdminActivityLog } from './entities/admin-activity-log.entity.js';
import { SystemRequest } from './entities/system-request.entity.js';
import { UserAction } from './entities/user-action.entity.js';
import { ReportedContent } from './entities/reported-content.entity.js';
import { SupportTicket } from './entities/support-ticket.entity.js';
import { SupportMessage } from './entities/support-message.entity.js';

// Existing entities needed for queries
import { User } from '../users/user.entity.js';
import { Company } from '../companies/company.entity.js';
import { Job } from '../jobs/job.entity.js';
import { AuditLog } from '../audit-logs/audit-log.entity.js';

// Services
import { AdminAuthService } from './services/admin-auth.service.js';
import { AdminDashboardService } from './services/admin-dashboard.service.js';
import { AdminUserManagementService } from './services/admin-user-management.service.js';
import { AdminCompanyReviewService } from './services/admin-company-review.service.js';
import { AdminContentManagementService } from './services/admin-content-management.service.js';
import { AdminTechnicalSupportService } from './services/admin-technical-support.service.js';
import { AdminSystemRequestService } from './services/admin-system-request.service.js';

// Controllers
import { AdminAuthController } from './controllers/admin-auth.controller.js';
import { AdminOpsController } from './controllers/admin-ops.controller.js';

// Strategy & Guards
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy.js';
import { AdminRolesGuard } from './guards/admin-roles.guard.js';

// External modules
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      AdminActivityLog,
      SystemRequest,
      UserAction,
      ReportedContent,
      SupportTicket,
      SupportMessage,
      User,
      Company,
      Job,
      AuditLog,
    ]),
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '8h' },
      }),
    }),
    MailModule,
  ],
  controllers: [AdminAuthController, AdminOpsController],
  providers: [
    AdminAuthService,
    AdminDashboardService,
    AdminUserManagementService,
    AdminCompanyReviewService,
    AdminContentManagementService,
    AdminTechnicalSupportService,
    AdminSystemRequestService,
    AdminJwtStrategy,
    AdminRolesGuard,
  ],
  exports: [AdminAuthService],
})
export class AdminModule {}
