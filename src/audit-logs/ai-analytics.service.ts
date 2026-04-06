import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AuditLog } from './audit-log.entity.js';
import { MailService } from '../mail/mail.service.js';
import { Job } from '../jobs/job.entity.js';

@Injectable()
export class AiAnalyticsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    private mailService: MailService,
  ) {}

  // ─── 1. Get Top Searched Terms ─────────────────────────────
  async getTopSearches(days = 7, limit = 20): Promise<{ term: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.auditLogRepo.find({
      where: {
        entity: 'TRAFFIC',
        timestamp: MoreThan(since),
      },
      order: { timestamp: 'DESC' },
    });

    const searchCounts: Record<string, number> = {};

    for (const log of logs) {
      const url = log.entityId || '';

      // Extract search from /jobs?search=xxx or /ai/smart-search?q=xxx
      let searchTerm = '';

      if (url.includes('/jobs') && url.includes('search=')) {
        const match = url.match(/search=([^&]+)/);
        if (match) searchTerm = decodeURIComponent(match[1]);
      }

      if (url.includes('/ai/smart-search') && url.includes('q=')) {
        const match = url.match(/q=([^&]+)/);
        if (match) searchTerm = decodeURIComponent(match[1]);
      }

      if (url.includes('/companies') && url.includes('search=')) {
        const match = url.match(/search=([^&]+)/);
        if (match) searchTerm = decodeURIComponent(match[1]);
      }

      if (searchTerm && searchTerm.trim() !== '') {
        const normalized = searchTerm.toLowerCase().trim();
        searchCounts[normalized] = (searchCounts[normalized] || 0) + 1;
      }
    }

    return Object.entries(searchCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ─── 2. Get Most Visited Companies ─────────────────────────
  async getTopVisitedCompanies(days = 7, limit = 10): Promise<{ companyId: string; visits: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.auditLogRepo.find({
      where: {
        entity: 'TRAFFIC',
        timestamp: MoreThan(since),
      },
    });

    const companyCounts: Record<string, number> = {};

    for (const log of logs) {
      const url = log.entityId || '';

      // Match /companies/:id patterns
      const match = url.match(/\/companies\/(\d+)/);
      if (match) {
        companyCounts[match[1]] = (companyCounts[match[1]] || 0) + 1;
      }
    }

    return Object.entries(companyCounts)
      .map(([companyId, visits]) => ({ companyId, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, limit);
  }

  // ─── 3. Get Most Viewed Jobs ───────────────────────────────
  async getTopViewedJobs(days = 7, limit = 10): Promise<{ jobId: string; views: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.auditLogRepo.find({
      where: {
        entity: 'TRAFFIC',
        timestamp: MoreThan(since),
      },
    });

    const jobCounts: Record<string, number> = {};

    for (const log of logs) {
      const url = log.entityId || '';

      const match = url.match(/\/jobs\/(\d+)/);
      if (match) {
        jobCounts[match[1]] = (jobCounts[match[1]] || 0) + 1;
      }
    }

    return Object.entries(jobCounts)
      .map(([jobId, views]) => ({ jobId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  // ─── 4. Get Traffic Summary ────────────────────────────────
  async getTrafficSummary(days = 7): Promise<{
    totalRequests: number;
    uniqueUsers: number;
    peakHour: number;
    errorCount: number;
    avgResponseTime: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.auditLogRepo.find({
      where: {
        entity: 'TRAFFIC',
        timestamp: MoreThan(since),
      },
    });

    const users = new Set<string>();
    const hourCounts: Record<number, number> = {};
    let errorCount = 0;
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      if (log.userId) users.add(log.userId);
      const hour = new Date(log.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      if (log.metadata?.statusCode >= 400) errorCount++;

      if (log.metadata?.duration) {
        totalDuration += log.metadata.duration;
        durationCount++;
      }
    }

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      totalRequests: logs.length,
      uniqueUsers: users.size,
      peakHour: peakHour ? parseInt(peakHour[0]) : 0,
      errorCount,
      avgResponseTime: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
    };
  }

  // ─── 5. Generate & Send Full Report via Email ──────────────
  async generateAndSendReport(days = 7): Promise<{ success: boolean; message: string }> {
    const adminEmail = process.env.MAIL_USER || 'mohamednasseremam380@gmail.com';

    const [topSearches, topCompanies, topJobs, traffic] = await Promise.all([
      this.getTopSearches(days),
      this.getTopVisitedCompanies(days),
      this.getTopViewedJobs(days),
      this.getTrafficSummary(days),
    ]);

    // Build search rows
    const searchRows = topSearches.length > 0
      ? topSearches.map((s, i) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; text-align: center;">${i + 1}</td>
          <td style="padding: 10px; font-weight: bold;">${s.term}</td>
          <td style="padding: 10px; text-align: center;">${s.count} مرة</td>
        </tr>`).join('')
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9ca3af;">لا توجد عمليات بحث في هذه الفترة</td></tr>';

    // Build company rows
    const companyRows = topCompanies.length > 0
      ? topCompanies.map((c, i) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; text-align: center;">${i + 1}</td>
          <td style="padding: 10px;">شركة #${c.companyId}</td>
          <td style="padding: 10px; text-align: center;">${c.visits} زيارة</td>
        </tr>`).join('')
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9ca3af;">لا توجد زيارات في هذه الفترة</td></tr>';

    // Build job rows
    const jobRows = topJobs.length > 0
      ? topJobs.map((j, i) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; text-align: center;">${i + 1}</td>
          <td style="padding: 10px;">وظيفة #${j.jobId}</td>
          <td style="padding: 10px; text-align: center;">${j.views} مشاهدة</td>
        </tr>`).join('')
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9ca3af;">لا توجد مشاهدات في هذه الفترة</td></tr>';

    const reportDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; direction: rtl;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📊 تقرير Jobito الذكي</h1>
        <p style="color: #e8e0ff; margin: 8px 0 0; font-size: 14px;">تقرير آخر ${days} أيام • ${reportDate}</p>
      </div>

      <!-- Traffic Summary Cards -->
      <div style="padding: 24px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <div style="background: white; border-radius: 12px; padding: 16px 24px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 120px;">
          <div style="font-size: 28px; font-weight: bold; color: #6366f1;">${traffic.totalRequests}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">إجمالي الطلبات</div>
        </div>
        <div style="background: white; border-radius: 12px; padding: 16px 24px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 120px;">
          <div style="font-size: 28px; font-weight: bold; color: #10b981;">${traffic.uniqueUsers}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">مستخدم فريد</div>
        </div>
        <div style="background: white; border-radius: 12px; padding: 16px 24px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 120px;">
          <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${traffic.peakHour}:00</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">ساعة الذروة</div>
        </div>
        <div style="background: white; border-radius: 12px; padding: 16px 24px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 120px;">
          <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${traffic.errorCount}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">أخطاء</div>
        </div>
      </div>

      <!-- Top Searches -->
      <div style="padding: 0 24px 24px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: #6366f1; padding: 14px 20px;">
            <h3 style="color: white; margin: 0; font-size: 16px;">🔍 أكثر الكلمات بحثاً</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; width: 50px;">#</th>
                <th style="padding: 10px; text-align: right;">كلمة البحث</th>
                <th style="padding: 10px; width: 100px;">العدد</th>
              </tr>
            </thead>
            <tbody>${searchRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Top Companies -->
      <div style="padding: 0 24px 24px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: #10b981; padding: 14px 20px;">
            <h3 style="color: white; margin: 0; font-size: 16px;">🏢 أكثر الشركات زيارة</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; width: 50px;">#</th>
                <th style="padding: 10px; text-align: right;">الشركة</th>
                <th style="padding: 10px; width: 100px;">الزيارات</th>
              </tr>
            </thead>
            <tbody>${companyRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Top Jobs -->
      <div style="padding: 0 24px 24px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: #f59e0b; padding: 14px 20px;">
            <h3 style="color: white; margin: 0; font-size: 16px;">💼 أكثر الوظائف مشاهدة</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; width: 50px;">#</th>
                <th style="padding: 10px; text-align: right;">الوظيفة</th>
                <th style="padding: 10px; width: 100px;">المشاهدات</th>
              </tr>
            </thead>
            <tbody>${jobRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #1e1b4b; padding: 20px; text-align: center;">
        <p style="color: #a5b4fc; margin: 0; font-size: 13px;">
          🤖 تم إنشاء هذا التقرير تلقائياً بواسطة نظام Jobito AI Analytics
        </p>
        <p style="color: #6366f1; margin: 6px 0 0; font-size: 11px;">
          متوسط زمن الاستجابة: ${traffic.avgResponseTime}ms
        </p>
      </div>
    </div>`;

    try {
      await this.mailService.sendSystemAlert(
        adminEmail,
        `📊 Jobito Weekly Analytics — ${reportDate}`,
        html,
      );
      return { success: true, message: `Report sent to ${adminEmail}` };
    } catch (err: any) {
      console.error('Failed to send report:', err);
      return { success: false, message: err.message || 'Failed to send email' };
    }
  }
}
