import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../users/user.entity.js';
import { Company } from '../../companies/company.entity.js';
import { Job } from '../../jobs/job.entity.js';
import { AuditLog } from '../../audit-logs/audit-log.entity.js';
import { Admin } from '../entities/admin.entity.js';
import { AdminActivityLog } from '../entities/admin-activity-log.entity.js';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    @InjectRepository(AdminActivityLog)
    private activityLogRepo: Repository<AdminActivityLog>,
    private dataSource: DataSource,
  ) {}

  /**
   * Super Admin Dashboard: System-wide stats
   */
  async getSystemStats() {
    // Active Users count
    const activeUsers = await this.userRepo.count({ where: { isActive: true } });
    
    // Total companies
    const totalCompanies = await this.companyRepo.count();
    
    // Active jobs
    const activeJobs = await this.jobRepo.count({ where: { isActive: true } });

    // Total operations/transactions (based on audit log entries this week)
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyOperations = await this.activityLogRepo.count({
      where: {} as any, // all activity logs count
    });

    // System uptime placeholder (would integrate with monitoring)
    const uptimePercent = 99.5;

    // Security alerts (failed logins, suspicious activity)
    const securityAlerts = await this.activityLogRepo
      .createQueryBuilder('log')
      .where("log.actionType IN (:...types)", { types: ['SECURITY_ALERT', 'FAILED_LOGIN', 'BAN_USER'] })
      .andWhere('log.createdAt > :week', { week: lastWeek })
      .getCount();

    // Users by role breakdown
    const usersByRole = await this.dataSource.query(
      `SELECT role, COUNT(*) as count FROM ptj.users WHERE is_active = true GROUP BY role ORDER BY count DESC`
    );

    return {
      activeUsers,
      operationsCount: weeklyOperations,
      systemUptime: uptimePercent,
      activeSecurityAlerts: securityAlerts,
      totalCompanies,
      activeJobs,
      usersByRole,
    };
  }

  /**
   * Weekly chart data for the super admin dashboard
   */
  async getWeeklyChartData() {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Daily new user registrations for the past 14 days
    const dailyRegistrations = await this.dataSource.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM ptj.users 
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [twoWeeksAgo],
    );

    // Daily activity (audit log entries)
    const dailyActivity = await this.dataSource.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM ptj.admin_activity_logs 
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [twoWeeksAgo],
    );

    return {
      registrations: dailyRegistrations,
      activity: dailyActivity,
    };
  }

  /**
   * Maintenance mode toggle (stored in-memory or could be in a settings table)
   */
  private maintenanceMode = false;

  getMaintenanceStatus() {
    return { maintenanceMode: this.maintenanceMode };
  }

  setMaintenanceMode(enabled: boolean) {
    this.maintenanceMode = enabled;
    return { maintenanceMode: this.maintenanceMode, message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled' };
  }
}
