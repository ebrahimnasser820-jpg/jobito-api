import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { User } from '../../users/user.entity.js';
import { UserAction, UserActionType } from '../entities/user-action.entity.js';
import { AdminAuthService } from './admin-auth.service.js';

@Injectable()
export class AdminUserManagementService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserAction)
    private userActionRepo: Repository<UserAction>,
    private adminAuthService: AdminAuthService,
    private dataSource: DataSource,
  ) {}

  /**
   * List users with search, filter, pagination
   */
  async listUsers(
    search?: string,
    accountType?: string,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const qb = this.userRepo.createQueryBuilder('user')
      .select([
        'user.userId',
        'user.fullName',
        'user.email',
        'user.phone',
        'user.role',
        'user.isActive',
        'user.accountStatus',
        'user.avatarUrl',
        'user.createdAt',
      ]);

    if (search) {
      qb.andWhere(
        '(LOWER(user.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR user.phone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (accountType) {
      qb.andWhere('user.role = :accountType', { accountType });
    }

    if (status) {
      if (status === 'active') {
        qb.andWhere('user.accountStatus = :status AND user.isActive = true', { status: 'active' });
      } else {
        qb.andWhere('user.accountStatus = :status', { status });
      }
    }

    qb.orderBy('user.createdAt', 'DESC');

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Get latest action type for each user
    const userIds = users.map(u => u.userId);
    let latestActions: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const actions = await this.dataSource.query(
        `SELECT DISTINCT ON (target_user_id) target_user_id, action_type, created_at
         FROM ptj.user_actions 
         WHERE target_user_id = ANY($1)
         ORDER BY target_user_id, created_at DESC`,
        [userIds],
      );
      actions.forEach((a: any) => {
        latestActions[a.target_user_id] = a.action_type;
      });
    }

    // Get user ratings
    let userRatings: Record<string, { average: number; count: number }> = {};
    if (userIds.length > 0) {
      try {
        const ratings = await this.dataSource.query(
          `SELECT rated_user_id, AVG(score) as avg_rating, COUNT(*) as rating_count
           FROM ptj.ratings
           WHERE rated_user_id = ANY($1)
           GROUP BY rated_user_id`,
          [userIds],
        );
        ratings.forEach((r: any) => {
          userRatings[r.rated_user_id] = {
            average: parseFloat(parseFloat(r.avg_rating).toFixed(1)),
            count: parseInt(r.rating_count),
          };
        });
      } catch {
        // Ratings table might not exist yet
      }
    }

    return {
      data: users.map((user) => ({
        userId: user.userId,
        name: user.fullName,
        contactInfo: user.email || user.phone,
        accountType: user.role === 'student' ? 'Student Client' : user.role === 'company' ? 'Business Owner' : 'User',
        status: user.accountStatus || 'active',
        rating: userRatings[user.userId] || { average: 0, count: 0 },
        lastActionType: latestActions[user.userId] || (user.isActive ? 'Active' : 'Inactive'),
        avatarUrl: user.avatarUrl,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single user details
   */
  async getUserDetails(userId: string) {
    const user = await this.userRepo.findOne({
      where: { userId },
      relations: ['applicantProfile'],
    });
    if (!user) throw new NotFoundException('User not found');

    // Get action history
    const actions = await this.userActionRepo.find({
      where: { targetUserId: userId },
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const { passwordHash, ...userData } = user as any;
    return {
      user: userData,
      actionHistory: actions.map((a) => ({
        actionType: a.actionType,
        reason: a.reason,
        adminName: a.admin?.fullName || 'Unknown',
        date: a.createdAt,
      })),
    };
  }

  /**
   * Execute moderation action on a user (warn, suspend, ban, unsuspend, unban)
   */
  async executeUserAction(adminId: string, targetUserId: string, actionType: UserActionType, reason?: string) {
    const user = await this.userRepo.findOne({ where: { userId: targetUserId } });
    if (!user) throw new NotFoundException('User not found');

    // Determine new account status
    let newStatus: string;
    switch (actionType) {
      case UserActionType.WARNING:
        newStatus = 'warned';
        break;
      case UserActionType.SUSPEND:
        newStatus = 'suspended';
        break;
      case UserActionType.BAN:
        newStatus = 'banned';
        user.isActive = false;
        break;
      case UserActionType.UNSUSPEND:
        newStatus = 'active';
        break;
      case UserActionType.UNBAN:
        newStatus = 'active';
        user.isActive = true;
        break;
      default:
        throw new BadRequestException('Invalid action type');
    }

    user.accountStatus = newStatus;
    await this.userRepo.save(user);

    // Record the action
    const action = this.userActionRepo.create({
      adminId,
      targetUserId,
      actionType,
      reason: reason || undefined,
    });
    await this.userActionRepo.save(action);

    // Log activity
    await this.adminAuthService.logActivity(
      adminId,
      actionType.toUpperCase(),
      'User',
      targetUserId,
      `${actionType} on user ${user.fullName}${reason ? ': ' + reason : ''}`,
      { previousStatus: user.accountStatus, newStatus },
    );

    return {
      message: `User ${user.fullName} has been ${actionType}${actionType === 'warning' ? 'ed' : 'ed'}.`,
      newStatus,
    };
  }
}
