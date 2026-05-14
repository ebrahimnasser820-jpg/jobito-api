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

    return {
      activeUsers,
      operationsCount: weeklyOperations,
      systemUptime: uptimePercent,
      activeSecurityAlerts: securityAlerts,
      totalCompanies,
      activeJobs,
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

  setMaintenanceMode(enabled: boolean) {
    AdminDashboardService.maintenanceMode = enabled;
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

    // Hourly breakdown of this ops manager's actions in last 24h
    const hourlyActivity = await this.dataSource.query(
      `SELECT 
         DATE_TRUNC('hour', created_at) as hour,
         COUNT(*) as count
       FROM ptj.admin_activity_logs
       WHERE admin_id = $1
         AND created_at >= $2
       GROUP BY DATE_TRUNC('hour', created_at)
       ORDER BY hour ASC`,
      [adminId, last24h],
    );

    // Total actions today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await this.activityLogRepo.count({
      where: { adminId } as any,
    });

    // Actions in last 24h specifically
    const last24hActions = await this.dataSource.query(
      `SELECT action_type, COUNT(*) as count
       FROM ptj.admin_activity_logs
       WHERE admin_id = $1 AND created_at >= $2
       GROUP BY action_type
       ORDER BY count DESC`,
      [adminId, last24h],
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
    } else {
      // Show ONLY operations manager activities in the general list
      const opsManagers = await this.adminRepo.find({
        where: { role: 'operation_manager' as any },
        select: ['adminId'],
      });
      const opsManagerIds = opsManagers.map(m => m.adminId);
      
      if (opsManagerIds.length > 0) {
        query.where('log.adminId IN (:...ids)', { ids: opsManagerIds });
      } else {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
    }

    const [logs, total] = await query.getManyAndCount();

    return {
      data: logs.map(log => ({
        logId: log.logId,
        adminName: log.admin?.fullName || 'Unknown',
        adminEmail: log.admin?.email || '',
        actionType: log.actionType,
        targetEntity: log.targetEntity,
        targetId: log.targetId,
        description: log.description,
        createdAt: log.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
