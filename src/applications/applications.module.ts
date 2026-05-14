import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './application.entity.js';
import { ApplicationsService } from './applications.service.js';
import { ApplicationsController } from './applications.controller.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

import { User } from '../users/user.entity.js';
import { ApplicantProfile } from '../users/applicant-profile.entity.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Application, User, ApplicantProfile]), 
        JobsModule,
        AuditLogsModule,
        NotificationsModule,
    ],
    controllers: [ApplicationsController],
    providers: [ApplicationsService],
})
export class ApplicationsModule { }
