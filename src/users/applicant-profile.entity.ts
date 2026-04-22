import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity({ schema: 'ptj', name: 'applicant_profiles' })
export class ApplicantProfile {
  @PrimaryGeneratedColumn('uuid', { name: 'profile_id' })
  profileId: string;

  @OneToOne(() => User, (user) => user.applicantProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resumeUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', default: [] })
  skills: any;

  @Column({ name: 'experience_years', type: 'int', default: 0 })
  experienceYears: number;

  @Column({ type: 'jsonb', default: [] })
  experiences: any[];

  @Column({ type: 'jsonb', default: [] })
  educations: any[];

  @Column({ type: 'jsonb', default: [] })
  portfolios: any[];

  @Column({ type: 'jsonb', default: [] })
  languages: string[];

  @Column({ type: 'jsonb', default: [] })
  services: string[];

  @Column({ name: 'social_links', type: 'jsonb', default: {} })
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
    linkedin?: string;
  };

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ length: 20, nullable: true })
  gender: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
