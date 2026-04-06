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

@Entity({ schema: 'ptj', name: 'favorites' })
@Unique(['userId', 'jobId'])
export class Favorite {
  @PrimaryGeneratedColumn({ name: 'favorite_id', type: 'bigint' })
  favoriteId: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'job_id', type: 'bigint' })
  jobId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;
}
