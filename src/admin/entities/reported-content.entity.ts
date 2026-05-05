import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum ContentReportReason {
  ACADEMIC_CHEATING = 'academic_cheating',
  FRAUD_SPAM = 'fraud_spam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  MISLEADING = 'misleading',
  OTHER = 'other',
}

@Entity({ schema: 'ptj', name: 'reported_content' })
export class ReportedContent {
  @PrimaryGeneratedColumn({ name: 'report_id' })
  reportId: number;

  @Column({ name: 'reporter_user_id', type: 'uuid', nullable: true })
  reporterUserId: string;

  @Column({ name: 'post_owner_id', type: 'uuid' })
  postOwnerId: string;

  @Column({ name: 'post_owner_name', length: 255 })
  postOwnerName: string;

  @Column({ name: 'content_type', length: 50 })
  contentType: string; // 'job', 'testimonial', 'profile', etc.

  @Column({ name: 'content_id', type: 'text' })
  contentId: string;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText: string;

  @Column({ type: 'varchar', length: 50 })
  reason: ContentReportReason;

  @Column({ name: 'custom_reason', type: 'text', nullable: true })
  customReason: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending', 'deleted', 'dismissed'

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
