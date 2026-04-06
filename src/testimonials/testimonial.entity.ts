import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity({ schema: 'ptj', name: 'testimonials' })
export class Testimonial {
    @PrimaryGeneratedColumn({ name: 'testimonial_id', type: 'bigint' })
    testimonialId: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ type: 'text' })
    body: string;

    @Column({ name: 'body_en', type: 'text', nullable: true })
    bodyEn: string;

    @Column({ name: 'is_featured', default: false })
    isFeatured: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
