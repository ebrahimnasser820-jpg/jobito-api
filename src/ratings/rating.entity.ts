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

  @Column({ name: 'rater_user_id', type: 'uuid', nullable: true })
  raterUserId: string;

  @Column({ name: 'rater_company_id', type: 'bigint', nullable: true })
  raterCompanyId: number;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string;

  @Column({ name: 'target_company_id', type: 'bigint', nullable: true })
  targetCompanyId: number;

  @Column({ name: 'rating_value', type: 'smallint' })
  ratingValue: number;

  @Column({ name: 'rater_type', length: 20, default: 'USER' })
  raterType: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rater_user_id' })
  raterUser: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'rater_company_id' })
  raterCompany: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'target_company_id' })
  targetCompany: Company;
}

