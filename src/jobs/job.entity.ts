import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from '../companies/company.entity.js';
import { User } from '../users/user.entity.js';
import { Category } from './category.entity.js';
import { Application } from '../applications/application.entity.js';

export enum JobType {
  PART_TIME = 'part-time',
  FULL_TIME = 'full-time',
  REMOTE = 'remote',
  ONE_TIME = 'one-time',
  EVENT = 'event',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract',
}

@Entity({ schema: 'ptj', name: 'jobs' })
export class Job {
  @PrimaryGeneratedColumn({ name: 'job_id', type: 'bigint' })
  jobId: number;

  @ManyToOne(() => Company, (company) => company.jobs, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id', type: 'bigint', nullable: true })
  companyId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => Category, (category) => category.jobs, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  categoryId: number | null;

  @Column({ length: 255 })
  title: string;



  @Column({ type: 'text', nullable: true })
  description: string;


  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  salary: number;

  @Column({
    name: 'salary_min',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  salaryMin: number;

  @Column({
    name: 'salary_max',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  salaryMax: number;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({
    name: 'job_type',
    type: 'varchar',
    length: 50,
    default: 'part-time',
  })
  jobType: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  classification: string;

  @Column({ name: 'slots_available', type: 'int', default: 1 })
  slotsAvailable: number;

  @Column({ name: 'price_type', length: 50, default: 'fixed' })
  priceType: string;

  @Column({ name: 'is_negotiable', default: false })
  isNegotiable: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'work_time', type: 'json', nullable: true })
  workTime: string[];

  @Column({ name: 'images', type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  skills: string[];

  @OneToMany(() => Application, (app) => app.job)
  applications: Application[];
}
