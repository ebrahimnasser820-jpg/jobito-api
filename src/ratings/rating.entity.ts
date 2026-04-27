import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';
import { Company } from '../companies/company.entity.js';

@Entity({ schema: 'ptj', name: 'ratings' })
export class Rating {
  @PrimaryGeneratedColumn({ name: 'rating_id', type: 'bigint' })
  ratingId: number;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'company_id', type: 'bigint', nullable: true })
  companyId: number;

  @Column({ name: 'rating_value', type: 'smallint' })
  ratingValue: number;

  @Column({ name: 'rater_type', length: 20, default: 'USER' })
  raterType: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
