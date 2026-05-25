import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly brevoApiKey: string;
  private readonly fromEmail: string;
  private readonly senderName: string;

  constructor() {
    this.brevoApiKey = process.env.BREVO_API_KEY || '';
    this.fromEmail = process.env.BREVO_SENDER_EMAIL || 'mohamednasseremam380@gmail.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Jobito';
    this.logger.log('📧 Mail transport: Brevo HTTP API (exclusive/cloud-safe)');
  }

  /**
   * Core send method — routes directly to Brevo HTTP API
   */
  private async send(options: { from: string; to: string; subject: string; html?: string; text?: string; replyTo?: string }): Promise<void> {
    await this.sendViaBrevo(options);
  }

  /**
   * Send email via Brevo HTTP API (uses port 443 — never blocked by cloud hosts)
   */
  private async sendViaBrevo(options: { from: string; to: string; subject: string; html?: string; text?: string; replyTo?: string }): Promise<void> {
    const body: any = {
      sender: {
        name: this.senderName,
        email: this.fromEmail,
      },
      to: [
        {
          email: options.to,
        }
      ],
      subject: options.subject,
    };

    if (options.html) {
      body.htmlContent = options.html;
    }
    if (options.text) {
      body.textContent = options.text;
    }
    if (options.replyTo) {
      body.replyTo = {
        email: options.replyTo,
      };
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.brevoApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorData}`);
    }

    const result = await response.json();
    this.logger.log(`✅ Email sent via Brevo to ${options.to} — MessageID: ${(result as any).messageId}`);
  }

  /** Send email verification link and code */
  async sendVerificationEmail(to: string, link: string, code: string): Promise<void> {
    await this.send({
      from: `"Jobito" <${this.fromEmail}>`,
      to,
      subject: 'Jobito — Verify Your Email',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #111827; font-size: 24px; font-weight: 800; margin: 0;">Welcome to Jobito! 🎉</h1>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 32px;">
            Thank you for joining our community. To get started, please verify your email address by clicking the button below <b>OR</b> by using the verification code:
          </p>

          <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;">
            <p style="text-transform: uppercase; font-size: 13px; color: #6b7280; font-weight: 600; margin-bottom: 12px; letter-spacing: 0.5px;">Your Verification Code</p>
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #2563eb; display: block; padding: 10px 0;">${code}</span>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${link}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; font-size: 12px; text-align: center; word-break: break-all; margin-top: 8px;">
            ${link}
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            This link and code will expire in 10 minutes. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  /** Send password reset code */
  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    await this.send({
      from: `"Jobito" <${this.fromEmail}>`,
      to,
      subject: 'Jobito — Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1f2937; text-align: center;">Password Reset 🔒</h2>
          <p style="color: #4b5563; text-align: center;">Use this code to reset your password:</p>
          <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc2626;">${code}</span>
          </div>
          <p style="color: #9ca3af; font-size: 13px; text-align: center;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }

  /** Send support contact email */
  async sendSupportEmail(data: any): Promise<void> {
    await this.send({
      from: `"Jobito Support" <${this.fromEmail}>`,
      to: process.env.MAIL_USER || this.fromEmail,
      replyTo: data.email,
      subject: `Contact Request: ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Contact Message</h2>
          <div style="margin: 20px 0;">
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Preferred Contact:</strong> ${data.preferredContact}</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; color: #374151;">${data.message}</p>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">This message was sent from the Jobito contact form.</p>
        </div>
      `,
    });
  }

  /** Send system alerts (AI Monitoring) */
  async sendSystemAlert(to: string, subject: string, html: string): Promise<void> {
    await this.send({
      from: `"Jobito AI Monitor" <${this.fromEmail}>`,
      to,
      subject: `[ALERT] ${subject}`,
      html,
    });
  }

  /** Send generic mail (plain text) */
  async sendMail(to: string, subject: string, text: string): Promise<void> {
    await this.send({
      from: `"Jobito" <${this.fromEmail}>`,
      to,
      subject,
      text,
    });
  }

  /** Send account moderation notification (Warning, Suspend, Ban) */
  async sendModerationEmail(to: string, name: string, reason: string, actionType: string): Promise<void> {
    let title = '';
    let emoji = '';
    let actionDesc = '';
    let color = '';
    let bgColor = '';

    if (actionType === 'WARNING') {
      title = 'Account Warning';
      emoji = '⚠️';
      color = '#f59e0b';
      bgColor = '#fef3c7';
      actionDesc = 'This is an official warning regarding your recent activity. No restrictions have been applied yet, but further violations may lead to account suspension.';
    } else if (actionType === 'SUSPEND') {
      title = 'Account Temporarily Restricted';
      emoji = '⏸️';
      color = '#f97316';
      bgColor = '#ffedd5';
      actionDesc = 'A temporary restriction is necessary. Your account will remain restricted for <b>10 days</b>.';
    } else {
      // BAN
      title = 'Account Permanently Banned';
      emoji = '🛑';
      color = '#ef4444';
      bgColor = '#fee2e2';
      actionDesc = 'Your account has been permanently banned due to severe or repeated violations of our terms of service.';
    }

    await this.send({
      from: `"Jobito Safety" <${this.fromEmail}>`,
      to,
      subject: `Jobito — ${title}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; background: #ffffff; border: 1px solid ${bgColor}; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: ${bgColor}; color: ${color}; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; font-size: 32px; margin-bottom: 16px;">${emoji}</div>
            <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0;">${title}</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Hello <b>${name}</b>,
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            ${actionDesc}
          </p>

          <div style="background: #f9fafb; border-left: 4px solid ${color}; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <p style="font-size: 13px; color: #6b7280; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Reason for Action</p>
            <p style="font-size: 15px; color: #1f2937; margin: 0; font-style: italic;">"${reason}"</p>
          </div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
            Jobito is committed to a safe and professional environment.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            If you believe this was a mistake, please reply to this email or contact support.
          </p>
        </div>
      `,
    });
  }

  /** Send review result email (Approve/Reject) */
  async sendReviewResultEmail(to: string, name: string, entityType: 'Company' | 'Criminal Record', action: 'approve' | 'reject', reason?: string): Promise<void> {
    const isApprove = action === 'approve';
    const title = isApprove ? 'Review Approved ✅' : 'Review Rejected ❌';
    const color = isApprove ? '#10b981' : '#ef4444';
    const bgColor = isApprove ? '#d1fae5' : '#fee2e2';
    
    let message = '';
    if (entityType === 'Company') {
      message = isApprove 
        ? 'Congratulations! Your company registration has been approved. You can now access all employer features.'
        : 'Unfortunately, your company registration request was rejected. Please review the requirements or contact support for further assistance.';
    } else {
      message = isApprove
        ? 'Congratulations! Your criminal record document has been verified. Your worker account is now active and ready to use.'
        : 'Unfortunately, your criminal record document was rejected. Your worker account access has been restricted. Please upload a valid document or contact support.';
    }

    await this.send({
      from: `"Jobito Operations" <${this.fromEmail}>`,
      to,
      subject: `Jobito — ${title}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: ${bgColor}; color: ${color}; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; font-size: 32px; margin-bottom: 16px;">
              ${isApprove ? '✅' : '❌'}
            </div>
            <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0;">${title}</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Hello <b>${name}</b>,
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            ${message}
          </p>

          ${!isApprove && reason ? `
          <div style="background: #f9fafb; border-left: 4px solid ${color}; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <p style="font-size: 13px; color: #6b7280; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Reason for Rejection</p>
            <p style="font-size: 15px; color: #1f2937; margin: 0; font-style: italic;">"${reason}"</p>
          </div>
          ` : ''}

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Thank you for choosing Jobito.
          </p>
        </div>
      `,
    });
  }
}
