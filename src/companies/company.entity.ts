import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Job } from '../jobs/job.entity.js';

@Entity({ schema: 'ptj', name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn({ name: 'company_id', type: 'bigint' })
  companyId: number;

  @Column({ length: 255 })
  name: string;



  @Column({ type: 'text', nullable: true })
  description: string;


  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'contact_email', length: 255, nullable: true })
  contactEmail: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ name: 'tax_id', length: 50, nullable: true })
  taxId: string;

  @Column({ name: 'license_number', length: 100, nullable: true })
  licenseNumber: string;

  @Column({ name: 'cr_document_url', type: 'text', nullable: true })
  crDocumentUrl: string;

  @Column({ name: 'verification_status', length: 50, default: 'PENDING' })
  verificationStatus: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ length: 50, nullable: true })
  employees: string;

  @Column({ length: 100, nullable: true })
  industry: string;

  @Column({ length: 100, nullable: true })
  classification: string;

  @Column({ name: 'foundedday', length: 50, nullable: true })
  foundedDay: string;

  @Column({ name: 'foundedmonth', length: 50, nullable: true })
  foundedMonth: string;

  @Column({ name: 'foundedyear', length: 50, nullable: true })
  foundedYear: string;

  @Column({ name: 'sociallinks', type: 'jsonb', nullable: true })
  socialLinks: any;

  @Column({ name: 'benefits', type: 'jsonb', nullable: true })
  benefits: any;

  @Column({ name: 'tech_stack', type: 'jsonb', nullable: true })
  techStack: any;

  @Column({ name: 'location_tags', type: 'jsonb', nullable: true })
  locationTags: any;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ name: 'office_photo1_url', type: 'text', nullable: true })
  officePhoto1Url: string;

  @Column({ name: 'office_photo2_url', type: 'text', nullable: true })
  officePhoto2Url: string;

  @Column({ name: 'official_national_id', length: 50, nullable: true })
  officialNationalId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Job, (job) => job.company)
  jobs: Job[];
}
