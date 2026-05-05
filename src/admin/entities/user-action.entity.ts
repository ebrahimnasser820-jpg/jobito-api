import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from './admin.entity.js';

export enum UserActionType {
  WARNING = 'warning',
  SUSPEND = 'suspend',
  BAN = 'ban',
  UNSUSPEND = 'unsuspend',
  UNBAN = 'unban',
}

@Entity({ schema: 'ptj', name: 'user_actions' })
export class UserAction {
  @PrimaryGeneratedColumn({ name: 'action_id' })
  actionId: number;

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId: string;

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @Column({ name: 'action_type', type: 'varchar', length: 30 })
  actionType: UserActionType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
