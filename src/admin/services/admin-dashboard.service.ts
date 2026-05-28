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
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  /**
   * Super Admin Dashboard: System-wide stats
   */
  async getSystemStats() {
    // Active Users count
    const activeUsers = await this.userRepo.count({ where: { isActive: true } });
    
    // Total approved companies
    const totalCompanies = await this.companyRepo.count({ where: { verificationStatus: 'APPROVED' } });
    
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
    const securityAlerts = await this.auditLogRepo
      .createQueryBuilder('log')
      .where("log.action IN (:...types)", { types: ['SECURITY_ALERT', 'FAILED_LOGIN', 'BAN_USER'] })
      .andWhere('log.timestamp > :week', { week: lastWeek })
      .getCount();

    // Users by role breakdown
    const usersByRoleRaw = await this.dataSource.query(
      `SELECT role, COUNT(*) as count FROM ptj.users WHERE is_active = true GROUP BY role`
    );

    const staffCount = await this.adminRepo.count();
    
    const distribution = {
      trainees: 0,
      companies: 0,
      staff: staffCount,
    };

    usersByRoleRaw.forEach((r: any) => {
      if (r.role === 'student' || r.role === 'user') distribution.trainees += parseInt(r.count);
      else if (r.role === 'company') distribution.companies += parseInt(r.count);
    });

    // Calculate placeholder revenue (e.g. 1500 per active company)
    const operationsRevenue = totalCompanies * 1500;

    return {
      activeUsers,
      operationsCount: weeklyOperations,
      systemUptime: uptimePercent,
      activeSecurityAlerts: securityAlerts,
      totalCompanies,
      activeJobs,
      operationsRevenue,
      usersByRole: usersByRoleRaw,
      userDistribution: distribution,
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
  static maintenanceMode = false;

  getMaintenanceStatus() {
    return { maintenanceMode: AdminDashboardService.maintenanceMode };
  }

  async setMaintenanceMode(enabled: boolean, adminId?: string) {
    AdminDashboardService.maintenanceMode = enabled;

    // Log maintenance toggle as a System event
    try {
      await this.activityLogRepo.save(this.activityLogRepo.create({
        adminId: adminId || null,
        actionType: enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        targetEntity: 'System',
        targetId: null,
        description: enabled ? 'Maintenance mode enabled — external user access disabled' : 'Maintenance mode disabled — system back online',
        metadata: { enabled },
      }));
    } catch (err) {
      console.error('Failed to log maintenance toggle:', err.message);
    }

    return { maintenanceMode: AdminDashboardService.maintenanceMode, message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled' };
  }

  /**
   * Get activity logs from Operations Managers only
   * Shows Super Admin what each ops manager has been doing
   */
  /**
   * Get hourly activity chart for an Operations Manager (last 24 hours)
   * Used to populate the "معدل الضغط والطلبات" line chart in their dashboard
   */
  async getOpsManagerChartData(adminId: string) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Hourly breakdown of all actions in last 24h for Operations Monitor
    const hourlyActivity = await this.dataSource.query(
      `SELECT 
         DATE_TRUNC('hour', created_at) as hour,
         COUNT(*) as count
       FROM ptj.admin_activity_logs
       WHERE created_at >= $1
       GROUP BY DATE_TRUNC('hour', created_at)
       ORDER BY hour ASC`,
      [last24h],
    );

    // Total actions today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await this.activityLogRepo.count();

    // Actions in last 24h specifically
    const last24hActions = await this.dataSource.query(
      `SELECT action_type, COUNT(*) as count
       FROM ptj.admin_activity_logs
       WHERE created_at >= $1
       GROUP BY action_type
       ORDER BY count DESC`,
      [last24h],
    );

    return {
      hourly: hourlyActivity,       // [{hour, count}]
      totalActions: todayCount,
      actionBreakdown: last24hActions,
    };
  }

  /**
   * Get activity logs. 
   * If adminId is provided, get logs for that specific admin.
   * If not, get logs for all Operations Managers (used by Super Admin).
   */
  async getAdminActivities(page = 1, limit = 50, adminId?: string) {
    const query = this.activityLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (adminId) {
      query.where('log.adminId = :adminId', { adminId });
    }
    // If no adminId is passed, it is accessed by Super Admin, so we return all system activities without restricting to operations managers

    const [logs, total] = await query.getManyAndCount();

    return {
      data: logs.map(log => {
        let adminName = 'System';
        let adminEmail = 'system@jobito.com';
        
        if (log.admin?.fullName) {
          adminName = log.admin.fullName;
          adminEmail = log.admin.email;
        } else if (log.metadata) {
          // Fallback to metadata for standard user actions recorded in the same activity table
          const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
          if (meta.email) {
            adminEmail = meta.email;
            adminName = meta.email.split('@')[0];
          }
        }

        return {
          logId: log.logId,
          adminName,
          adminEmail,
          actionType: log.actionType,
          targetEntity: log.targetEntity,
          targetId: log.targetId,
          description: log.description,
          createdAt: log.createdAt,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
