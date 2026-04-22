import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity.js';
import { Job } from '../jobs/job.entity.js';

@Entity({ schema: 'ptj', name: 'applications' })
@Unique(['jobId', 'userId'])
export class Application {
  @PrimaryGeneratedColumn({ name: 'application_id', type: 'bigint' })
  applicationId: number;

  @ManyToOne(() => Job, (job) => job.applications)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'job_id', type: 'bigint' })
  jobId: number;

  @ManyToOne(() => User, (user) => user.applications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'portfolio_url', type: 'text', nullable: true })
  portfolioUrl: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  coverLetter: string;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resumeUrl: string;

  @Column({ name: 'status', length: 50, default: 'applied' })
  status: string;

  @CreateDateColumn({ name: 'applied_at', type: 'timestamptz' })
  appliedAt: Date;
}
