import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly senderName: string;

  constructor() {
    this.fromEmail = process.env.BREVO_SENDER_EMAIL || 'mohamednasseremam380@gmail.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Jobito';
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // Force IPv4 — fixes ENETUNREACH on IPv6-disabled networks
      auth: {
        user: this.fromEmail,
        pass: process.env.GMAIL_APP_PASSWORD || '',
      },
    } as nodemailer.TransportOptions);

    this.logger.log('📧 Mail transport: Nodemailer (Gmail SMTP)');
  }

  /**
   * Core send method — routes directly to Gmail SMTP
   */
  private async send(options: { from: string; to: string; subject: string; html?: string; text?: string; replyTo?: string }): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.senderName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });
      this.logger.log(`✅ Email sent via Gmail to ${options.to} — MessageID: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${options.to}: ${error.message}`);
      throw error;
    }
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
            Thank you for joining our community. To get started, please verify your email address by using the verification code below:
          </p>

          <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;">
            <p style="text-transform: uppercase; font-size: 13px; color: #6b7280; font-weight: 600; margin-bottom: 12px; letter-spacing: 0.5px;">Your Verification Code</p>
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #2563eb; display: block; padding: 10px 0;">${code}</span>
          </div>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            This code will expire in 10 minutes. If you didn't create an account, you can safely ignore this email.
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
  /** Send auto-generated password to new Google sign-up users */
  async sendGoogleWelcomePassword(to: string, name: string, password: string): Promise<void> {
    await this.send({
      from: `"Jobito" <${this.fromEmail}>`,
      to,
      subject: 'Jobito — Welcome! Here is your account password 🔑',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #dbeafe; color: #2563eb; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; font-size: 32px; margin-bottom: 16px;">🔑</div>
            <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0;">Welcome to Jobito!</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Hello <b>${name}</b>,
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Your account has been created successfully using Google. We have generated a password for you so you can also log in using your email and password:
          </p>

          <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="font-size: 13px; color: #6b7280; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Password</p>
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #16a34a; display: block; padding: 8px 0; font-family: monospace; word-break: break-all;">${password}</span>
          </div>

          <div style="background: #fefce8; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="font-size: 14px; color: #92400e; margin: 0; font-weight: 600;">⚠️ Important Security Notice</p>
            <p style="font-size: 13px; color: #78716c; margin: 8px 0 0 0;">We recommend changing this password from your account settings after logging in. Do not share this password with anyone.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Thank you for joining Jobito! 🎉
          </p>
        </div>
      `,
    });
  }

  /** Send account deletion confirmation email */
  async sendAccountDeletedEmail(to: string, name: string): Promise<void> {
    await this.send({
      from: `"Jobito" <${this.fromEmail}>`,
      to,
      subject: 'Jobito — Account Deleted',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #fee2e2; color: #ef4444; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; font-size: 32px; margin-bottom: 16px;">
              🗑️
            </div>
            <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0;">Account Deleted</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Hello <b>${name}</b>,
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            We're writing to confirm that your Jobito account has been permanently deleted, as requested 2 days ago. 
            All of your personal data and associated records have been removed from our active systems.
          </p>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 32px;">
            We're sorry to see you go! If you ever wish to return, you are always welcome to create a new account.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Thank you for being part of Jobito.
          </p>
        </div>
      `,
    });
  }

  /** Send account deletion scheduled email (2 days grace period) */
  async sendAccountDeletionScheduledEmail(to: string, name: string): Promise<void> {
    await this.send({
      from: `"Jobito" <${this.fromEmail}>`,
      to,
      subject: 'Jobito — تم جدولة حذف حسابك',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" dir="rtl">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #fef3c7; color: #f59e0b; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; font-size: 32px; margin-bottom: 16px;">
              ⚠️
            </div>
            <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0;">طلب حذف الحساب قيد التنفيذ</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            مرحباً <b>${name}</b>،
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            لقد تلقينا طلبك لحذف حسابك من منصة Jobito. تم وضع الحساب في جدول الحذف وسيتم إزالة جميع بياناتك بشكل نهائي من أنظمتنا بعد <b>يومين (48 ساعة)</b>. 
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            لقد تم إخفاء وظائفك وملفك الشخصي من الموقع في الوقت الحالي.
          </p>

          <div style="background: #f9fafb; border-right: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <p style="font-size: 15px; color: #1f2937; margin: 0; font-weight: bold;">تغيير الرأي؟</p>
            <p style="font-size: 14px; color: #4b5563; margin: 8px 0 0 0;">إذا لم تقم بهذا الطلب أو غيرت رأيك، يمكنك إلغاء الحذف ببساطة عن طريق تسجيل الدخول إلى حسابك قبل انقضاء اليومين والضغط على زر "إلغاء الحذف".</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            شكراً لكونك جزءاً من منصة Jobito.
          </p>
        </div>
      `,
    });
  }

  /** Send 2FA code to System Admin for Dashboard Access */
  async sendAdmin2FACode(to: string, code: string): Promise<void> {
    await this.send({
      from: `"Jobito Security" <${this.fromEmail}>`,
      to,
      subject: 'Jobito — System Admin Login 2FA Code 🔐',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #e0e7ff; color: #4f46e5; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; font-size: 32px; margin-bottom: 16px;">
              🔐
            </div>
            <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0;">Admin Authentication</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; text-align: center;">
            A login attempt was detected for your System Admin account. Please use the verification code below to complete the authentication process.
          </p>

          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="font-size: 13px; color: #64748b; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your 2FA Code</p>
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f172a; display: block; padding: 8px 0; font-family: monospace;">${code}</span>
          </div>

          <div style="background: #fefce8; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="font-size: 14px; color: #92400e; margin: 0; font-weight: 600;">⚠️ Security Notice</p>
            <p style="font-size: 13px; color: #78716c; margin: 8px 0 0 0;">This code expires in 10 minutes. If you did not attempt to log in, please secure your account immediately or contact the IT department.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Jobito Security Operations Center
          </p>
        </div>
      `,
    });
  }
}
