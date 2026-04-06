import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  /** Send email verification link and code */
  async sendVerificationEmail(to: string, link: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"Jobito" <${process.env.MAIL_USER}>`,
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
    await this.transporter.sendMail({
      from: `"Jobito" <${process.env.MAIL_USER}>`,
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
    await this.transporter.sendMail({
      from: `"Jobito Support" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
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
    await this.transporter.sendMail({
      from: `"Jobito AI Monitor" <${process.env.MAIL_USER}>`,
      to,
      subject: `[ALERT] ${subject}`,
      html,
    });
  }
}
