import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    _id: string; // Keep _id to match frontend Mongo-style expectations

    @Column()
    senderId: string;

    @Column()
    recipientId: string;

    @Column({ nullable: true })
    message: string;

    @Column({ default: 'text' })
    type: string;

    @Column({ nullable: true })
    audioUrl: string;

    @Column({ nullable: true })
    duration: number;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    clientId: string;

    @CreateDateColumn()
    createdAt: Date;
}
