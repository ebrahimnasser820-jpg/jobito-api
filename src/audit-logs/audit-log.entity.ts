import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'ptj', name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'log_id' })
  logId: number;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ nullable: true })
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'READ'

  @Column({ nullable: true })
  entity: string; // 'Job', 'Company', 'User', etc.

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional data about the action

  @CreateDateColumn()
  timestamp: Date;
}
