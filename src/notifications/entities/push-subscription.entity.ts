import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity.js';

@Entity({ name: 'push_subscriptions', schema: 'ptj' })
@Index(['userId', 'platform'], { unique: false })
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Platform type: 'fcm' for Firebase (mobile), 'web' for Web Push API (browser)
   */
  @Column({ length: 10 })
  platform: 'fcm' | 'web';

  /**
   * For FCM: the device registration token
   * For Web Push: null (uses the subscription JSON instead)
   */
  @Column({ name: 'device_token', type: 'text', nullable: true })
  deviceToken: string | null;

  /**
   * For Web Push: the full PushSubscription JSON object from the browser
   * For FCM: null
   */
  @Column({ name: 'web_subscription', type: 'jsonb', nullable: true })
  webSubscription: object | null;

  /**
   * Optional device name/identifier for management
   */
  @Column({ name: 'device_name', type: 'varchar', length: 100, nullable: true })
  deviceName: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
