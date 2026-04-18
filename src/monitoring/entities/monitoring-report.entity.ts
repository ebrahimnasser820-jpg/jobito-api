import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity({ schema: 'ptj', name: 'monitoring_reports' })
export class MonitoringReport {
  @PrimaryGeneratedColumn('uuid', { name: 'report_id' })
  reportId: string;

  @Column({ name: 'error_type', nullable: true })
  errorType: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'frequency', default: 1 })
  frequency: number;

  @Column({
    type: 'enum',
    enum: Severity,
    default: Severity.LOW,
  })
  severity: Severity;

  @Column({ name: 'suggested_solution', type: 'text', nullable: true })
  suggestedSolution: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
