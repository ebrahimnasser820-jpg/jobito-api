import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from './admin.entity.js';

export enum SystemRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SystemRequestType {
  ADD_OPERATION_MANAGER = 'add_operation_manager',
  ROLE_UPGRADE = 'role_upgrade',
}

@Entity({ schema: 'ptj', name: 'system_requests' })
export class SystemRequest {
  @PrimaryGeneratedColumn({ name: 'request_id' })
  requestId: number;

  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId: string;

  @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: Admin;

  @Column({ name: 'request_type', type: 'varchar', length: 50 })
  requestType: SystemRequestType;

  @Column({ name: 'candidate_name', length: 255 })
  candidateName: string;

  @Column({ name: 'candidate_email', length: 255 })
  candidateEmail: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 20, default: SystemRequestStatus.PENDING })
  status: SystemRequestStatus;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: Admin;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
