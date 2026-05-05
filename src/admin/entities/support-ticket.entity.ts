import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'ptj', name: 'support_tickets' })
export class SupportTicket {
  @PrimaryGeneratedColumn({ name: 'ticket_id' })
  ticketId: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'user_name', length: 255 })
  userName: string;

  @Column({ name: 'user_email', length: 255, nullable: true })
  userEmail: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string; // 'open', 'in_progress', 'resolved', 'closed'

  @Column({ name: 'assigned_admin_id', type: 'uuid', nullable: true })
  assignedAdminId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
