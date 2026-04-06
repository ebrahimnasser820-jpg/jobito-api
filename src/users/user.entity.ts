import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Application } from '../applications/application.entity.js';

@Entity({ schema: 'ptj', name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 50, default: 'student' })
  role: string;

  @Column({ length: 100, nullable: true })
  classification: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: any;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ length: 20, nullable: true })
  gender: string;

  @Column({ type: 'jsonb', default: [] })
  experiences: any[];

  @Column({ type: 'jsonb', default: [] })
  educations: any[];

  @Column({ type: 'jsonb', default: [] })
  portfolios: any[];

  @Column({ type: 'int', default: 0 })
  experience: number;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'service_radius_km', type: 'int', default: 10 })
  serviceRadiusKm: number;

  @Column({ type: 'jsonb', default: [] })
  languages: string[];

  @Column({ name: 'social_links', type: 'jsonb', default: {} })
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
    linkedin?: string;
  };

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'notification_preferences', type: 'jsonb', default: { applications: true, jobs: false, recs: false } })
  notificationPreferences: { applications: boolean; jobs: boolean; recs: boolean };

  @Column({ name: 'google_id', length: 255, nullable: true })
  googleId: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resumeUrl: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Application, (app) => app.user)
  applications: Application[];
}
