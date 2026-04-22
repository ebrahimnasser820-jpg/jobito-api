import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Application } from '../applications/application.entity.js';
import { Job } from '../jobs/job.entity.js';
import { ApplicantProfile } from './applicant-profile.entity.js';

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;
  //  default: 'user' ==> User ,
  @Column({ length: 50, default: 'user' })
  role: string;

  @Column({ length: 100, nullable: true })
  classification: string;

  @OneToOne(() => ApplicantProfile, (profile) => profile.user)
  applicantProfile: ApplicantProfile;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ name: 'registration_data', type: 'text', nullable: true })
  registrationData: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'service_radius_km', type: 'int', default: 10 })
  serviceRadiusKm: number;



  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'notification_preferences', type: 'jsonb', default: { applications: true, jobs: false, recs: false } })
  notificationPreferences: { applications: boolean; jobs: boolean; recs: boolean };

  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;



  @Column({ name: 'banner_url', type: 'text', nullable: true })
  banner_url: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ name: 'theme_preference', length: 10, default: 'light' })
  themePreference: string;

  @Column({ name: 'language_preference', length: 10, default: 'en' })
  languagePreference: string;

  @Column({ name: 'deletion_requested_at', type: 'timestamptz', nullable: true })
  deletionRequestedAt: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Application, (app) => app.user)
  applications: Application[];

  @OneToMany(() => Job, (job) => job.user)
  jobs: Job[];
}
