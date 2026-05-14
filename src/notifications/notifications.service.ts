import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PushService } from './push.service.js';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly pushService: PushService,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  @EventPattern('user_registered')
  async handleUserRegistered(@Payload() data: { email: string; code: string }) {
    this.logger.log(`📧 Received registration event for: ${data.email}`);
    try {
      // Build the verification link pointing to the backend's new verify-link endpoint
      const apiHost = process.env.API_BASE_URL || 'http://localhost:3000';
      const verifyLink = `${apiHost}/auth/verify-link?email=${encodeURIComponent(data.email)}&code=${encodeURIComponent(data.code)}`;
      
      await this.mailService.sendVerificationEmail(data.email, verifyLink, data.code);
      this.logger.log(`✅ Verification email (Link + Code: ${data.code}) sent successfully to ${data.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${data.email}`, error.stack);
    }
  }

  @EventPattern('job_applied')
  async handleJobApplied(@Payload() data: { email: string; jobTitle: string }) {
    this.logger.log(`💼 Notifying company about new application for: ${data.jobTitle}`);
    // Future implementation for notifying companies
  }

  async sendNotification(userId: string, title: string, message: string, type?: string) {
    this.logger.log(`🔔 Internal Notification for ${userId}: ${title} - ${message}`);
    
    const notification = this.notificationRepo.create({
      userId,
      title,
      message,
      type: type || 'SYSTEM',
    });

    await this.notificationRepo.save(notification);

    // ─── Also send Push Notification (FCM + Web Push) ───────────
    try {
      await this.pushService.sendPushToUser(userId, title, message, {
        type: type || 'SYSTEM',
        notificationId: String(notification.id),
      });
    } catch (err) {
      this.logger.warn(`⚠️ Push notification failed for ${userId}: ${err.message}`);
    }

    return { success: true };
  }
}
