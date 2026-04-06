import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity({ schema: 'ptj', name: 'otp_codes' })
export class OtpCode {
    @PrimaryGeneratedColumn('uuid', { name: 'otp_id' })
    otpId: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ length: 10 })
    code: string;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    @Column({ name: 'is_used', default: false })
    isUsed: boolean;
}
