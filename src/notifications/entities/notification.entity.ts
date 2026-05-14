import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity.js';

@Entity({ name: 'notifications', schema: 'ptj' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  type: string; // e.g., 'WARNING', 'SUSPENSION', 'BAN', 'SYSTEM'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
