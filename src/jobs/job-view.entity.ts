import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Job } from './job.entity.js';
import { User } from '../users/user.entity.js';

@Entity({ schema: 'ptj', name: 'job_views' })
export class JobView {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'job_id', type: 'bigint' })
  jobId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'session_id', length: 255, nullable: true })
  sessionId: string | null;

  @CreateDateColumn({ name: 'viewed_at', type: 'timestamptz' })
  viewedAt: Date;
}
