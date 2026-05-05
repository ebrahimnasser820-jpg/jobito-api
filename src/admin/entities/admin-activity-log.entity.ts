import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from './admin.entity.js';

@Entity({ schema: 'ptj', name: 'admin_activity_logs' })
export class AdminActivityLog {
  @PrimaryGeneratedColumn({ name: 'log_id' })
  logId: number;

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId: string;

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ name: 'action_type', length: 100 })
  actionType: string; // 'LOGIN', 'WARN_USER', 'SUSPEND_USER', 'BAN_USER', 'APPROVE_COMPANY', 'REJECT_COMPANY', 'INVITE_ADMIN', 'MODIFY_SETTINGS', etc.

  @Column({ name: 'target_entity', length: 100, nullable: true })
  targetEntity: string; // 'User', 'Company', 'Admin', 'System'

  @Column({ name: 'target_id', type: 'text', nullable: true })
  targetId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
