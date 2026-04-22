import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { ApplicantProfile } from './applicant-profile.entity.js';
import { UsersService } from './users.service.js';
import { DeletionCleanupService } from './deletion-cleanup.service.js';
// import { ChatModule } from '../chat/chat.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ApplicantProfile]),
    forwardRef(() => AuthModule),
    // ChatModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, DeletionCleanupService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
