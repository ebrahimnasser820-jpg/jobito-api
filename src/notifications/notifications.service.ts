import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly mailService: MailService) {}

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

  async sendNotification(userId: string, title: string, message: string, extraData?: any) {
    this.logger.log(`🔔 Internal Notification for ${userId}: ${title} - ${message}`);
    // Here we can store in DB or send via Push/Email
    return { success: true };
  }
}
