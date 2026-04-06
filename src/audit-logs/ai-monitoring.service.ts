import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AuditLog } from './audit-log.entity.js';
import { User } from '../users/user.entity.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class AiMonitoringService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mailService: MailService,
  ) {}

  /**
   * Main entry point for real-time traffic analysis
   */
  async analyzeTraffic(data: {
    method: string;
    url: string;
    reqBody: any;
    resBody: any;
    userId: string;
    duration: number;
    statusCode: number;
  }) {
    // 1. Log to AuditLog (Persistent Storage)
    const log = this.auditLogRepo.create({
      userId: data.userId !== 'GUEST' ? data.userId : undefined,
      action: data.method,
      entity: 'TRAFFIC',
      entityId: data.url,
      metadata: {
        reqBody: data.reqBody,
        resBody: data.resBody,
        duration: data.duration,
        statusCode: data.statusCode,
      }
    });

    try {
      await this.auditLogRepo.save(log);
    } catch (err) {
      console.error('Failed to save audit log:', err);
    }

    // 2. AI Heuristic Check
    let riskReason = '';
    const riskScore = await this.calculateRiskScore(data);

    if (riskScore > 70) {
      riskReason = 'High traffic anomaly or suspicious payload detected.';
    }

    // 3. Automated Action: Send Email Alerts
    if (riskScore > 70 || data.statusCode >= 500) {
      await this.sendAiAlert({
        reason: riskReason || `Server Error ${data.statusCode} detected`,
        details: data
      });
    }
  }

  private async calculateRiskScore(data: any): Promise<number> {
    let score = 0;
    // Heuristic 1: Status Code 500
    if (data.statusCode >= 500) score += 40;
    
    // Heuristic 2: Large Response/Payload on sensitive routes
    if (data.url.includes('auth') && JSON.stringify(data.resBody).length > 5000) score += 50;

    // Heuristic 3: Rapid sequential errors (would need cache/state, but for now simple)
    return score;
  }

  private async sendAiAlert(data: { reason: string; details: any }) {
    const adminEmail = process.env.MAIL_USER || 'mohamednasseremam380@gmail.com';
    const html = `
      <div style="font-family: sans-serif; border: 2px solid #dc2626; padding: 20px; border-radius: 8px;">
        <h2 style="color: #dc2626;">🚨 AI Security Alert</h2>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <hr/>
        <p><strong>Method:</strong> ${data.details.method}</p>
        <p><strong>URL:</strong> ${data.details.url}</p>
        <p><strong>User ID:</strong> ${data.details.userId}</p>
        <p><strong>Status:</strong> ${data.details.statusCode}</p>
        <div style="background: #f3f4f6; padding: 10px; margin-top: 10px;">
          <strong>Request Payload:</strong>
          <pre>${JSON.stringify(data.details.reqBody, null, 2)}</pre>
        </div>
      </div>
    `;
    
    try {
      await this.mailService.sendSystemAlert(adminEmail, 'AI Monitoring Alert', html);
    } catch (err) {
      console.error('Failed to send AI Alert Email:', err);
    }
  }

  async suggestRoleForUser(userId: string): Promise<string> {
    const logs = await this.auditLogRepo.find({
      where: { userId: userId },
      take: 100,
      order: { timestamp: 'DESC' },
    });

    if (logs.length === 0) return 'student';

    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (actionCounts['CREATE'] > 5 && logs.some(l => l.entity === 'JOB')) {
      return 'company';
    }

    if (actionCounts['DELETE'] > 10 || actionCounts['UPDATE'] > 20) {
      return 'manager';
    }

    return 'student';
  }

  async isBehaviorSuspicious(userId: string): Promise<boolean> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const creations = await this.auditLogRepo.count({
      where: { userId, action: 'CREATE', timestamp: MoreThan(oneHourAgo) },
    });

    if (creations > 50) return true;

    const deletions = await this.auditLogRepo.count({
      where: { userId, action: 'DELETE', timestamp: MoreThan(oneHourAgo) },
    });

    if (deletions > 20) return true;

    const currentHour = new Date().getHours();
    if (currentHour >= 2 && currentHour <= 5) {
      const recentLogs = await this.auditLogRepo.count({
        where: { userId, timestamp: MoreThan(oneHourAgo) },
      });
      if (recentLogs > 50) return true;
    }

    return false;
  }

  async calculateUserRiskScore(userId: string): Promise<number> {
    const logs = await this.auditLogRepo.find({ where: { userId }, take: 200 });
    let score = 0;

    if (logs.length > 150) score += 30;

    const deleteCount = logs.filter(l => l.action === 'DELETE').length;
    score += (deleteCount / logs.length) * 50;

    const uniqueEntities = new Set(logs.map(l => l.entity)).size;
    if (uniqueEntities > 5) score += 20;

    return Math.min(score, 100);
  }
}
