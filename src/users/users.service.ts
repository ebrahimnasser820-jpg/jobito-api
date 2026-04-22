import { Injectable, Logger } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { User } from './user.entity.js';
import { ApplicantProfile } from './applicant-profile.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { AppGateway } from '../common/gateways/app.gateway.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ApplicantProfile)
    private profileRepository: Repository<ApplicantProfile>,
    private readonly gateway: AppGateway,
  ) { }

  findAll() {
    return this.usersRepository.find();
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email }, relations: ['applicantProfile'] });
  }

  findByGoogleId(googleId: string) {
    return this.usersRepository.findOne({ where: { googleId }, relations: ['applicantProfile'] });
  }

  async create(userData: Partial<User>) {
    const user = this.usersRepository.create(userData);
    const updatedUser = await this.usersRepository.save(user);

    // Broadcast update via WebSocket
    this.gateway.notifyUserUpdate(updatedUser.userId, {
      userId: updatedUser.userId,
      fullName: updatedUser.fullName,
      avatarUrl: updatedUser.avatarUrl,
    });

    return updatedUser;
  }

  findById(userId: string) {
    return this.usersRepository.findOne({ where: { userId }, relations: ['applicantProfile'] });
  }

  async update(userId: string, data: Partial<User> & Partial<ApplicantProfile>) {
    const {
      skills, bio, dob, gender, experiences, educations, portfolios,
      experienceYears, languages, services, socialLinks, resumeUrl,
      ...userData
    } = data as any;

    if (Object.keys(userData).length > 0) {
      await this.usersRepository.update(userId, userData);
    }

    const profileData = { skills, bio, dob, gender, experiences, educations, portfolios, experienceYears, languages, services, socialLinks, resumeUrl };
    
    // Remove undefined properties from profileData
    Object.keys(profileData).forEach(key => profileData[key] === undefined ? delete profileData[key] : {});

    if (Object.keys(profileData).length > 0) {
      let profile = await this.profileRepository.findOne({ where: { userId } });
      if (!profile) {
        profile = this.profileRepository.create({ userId, ...profileData });
      } else {
        Object.assign(profile, profileData);
      }
      await this.profileRepository.save(profile);
    }

    const updatedUser = await this.findById(userId);

    if (updatedUser) {
      this.gateway.notifyUserUpdate(userId, {
        userId: userId,
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
      });
    }

    return updatedUser;
  }

  async remove(userId: string) {
    const user = await this.findById(userId);
    if (user) {
      return await this.usersRepository.remove(user);
    }
    return null;
  }

  private readonly logger = new Logger(UsersService.name);

  async processExpiredDeletions() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredUsers = await this.usersRepository.find({
      where: {
        deletionRequestedAt: LessThan(sevenDaysAgo),
        isActive: true,
      },
    });

    if (expiredUsers.length === 0) return;

    this.logger.log(`Processing ${expiredUsers.length} expired account deletions...`);

    for (const user of expiredUsers) {
      try {
        // Soft delete strategy: deactivate and scrub PII
        await this.usersRepository.update(user.userId, {
          isActive: false,
          deletionRequestedAt: null,
          fullName: 'Deleted User',
          email: `deleted_${user.userId}@jobito.com`, // Anonymize email
          phone: null,
          googleId: null,
        });
        this.logger.log(`Account ${user.userId} has been processed for deletion.`);
      } catch (error) {
        this.logger.error(`Failed to process deletion for user ${user.userId}: ${error.message}`);
      }
    }
  }
}
