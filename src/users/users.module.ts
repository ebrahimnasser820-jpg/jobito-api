import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { ApplicantProfile } from './applicant-profile.entity.js';
import { UsersService } from './users.service.js';
import { DeletionCleanupService } from './deletion-cleanup.service.js';
import { MongoUserProfile, MongoUserProfileSchema } from './schemas/mongo-user-profile.schema.js';
import { MongoUserProfileService } from './mongo-user-profile.service.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ApplicantProfile]),
    MongooseModule.forFeature([{ name: MongoUserProfile.name, schema: MongoUserProfileSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => CompaniesModule),
    MailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, DeletionCleanupService, MongoUserProfileService],
  exports: [UsersService, TypeOrmModule, MongoUserProfileService],
})
export class UsersModule {}
