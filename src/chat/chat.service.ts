import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { ChatMessage } from './chat-message.entity.js';
import { AppGateway } from '../common/gateways/app.gateway.js';
import { JobsService } from '../jobs/jobs.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User } from '../users/user.entity.js';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatMessage) private chatRepository: Repository<ChatMessage>,
        @InjectRepository(User) private usersRepository: Repository<User>,
        private readonly gateway: AppGateway,
        private readonly jobsService: JobsService,
        private readonly notificationsService: NotificationsService,
    ) {}

    // P2P Messaging (The main one for ChatApp)
    async sendP2PMessage(senderId: string, recipientId: string, content: string, type: string = 'text', clientId?: string) {
        const newMessage = this.chatRepository.create({
            senderId,
            recipientId,
            message: content,
            type,
            clientId,
        });

        const saved = await this.chatRepository.save(newMessage);
        
        // Notify recipient via WS using the new P2P event name
        this.gateway.notifyNewP2PMessage(recipientId, saved);
        // Also notify sender (for multi-device sync)
        this.gateway.notifyNewP2PMessage(senderId, saved);

        return saved;
    }

    async saveVoiceMessage(senderId: string, recipientId: string, audioUrl: string, duration: number, clientId?: string) {
        const newMessage = this.chatRepository.create({
            senderId,
            recipientId,
            audioUrl,
            duration: Math.round(duration),
            type: 'voice',
            clientId,
        });

        const saved = await this.chatRepository.save(newMessage);
        
        this.gateway.notifyNewP2PMessage(recipientId, saved);
        this.gateway.notifyNewP2PMessage(senderId, saved);

        return saved;
    }

    async getP2PHistory(userId: string, otherId: string, page: number = 1, limit: number = 50) {
        return await this.chatRepository.find({
            where: [
                { senderId: userId, recipientId: otherId },
                { senderId: otherId, recipientId: userId },
            ],
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async getMyChats(userId: string) {
        // Since TypeORM doesn't have a direct equivalent to Mongo's complex $group aggregate easily, 
        // we'll get the latest messages and group them in memory for better cross-DB compatibility.
        
        const allMessages = await this.chatRepository.find({
            where: [
                { senderId: userId },
                { recipientId: userId }
            ],
            order: { createdAt: 'DESC' }
        });

        const chatMap = new Map<string, any>();

        for (const msg of allMessages) {
            const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
            if (!chatMap.has(partnerId)) {
                chatMap.set(partnerId, {
                    partnerId,
                    lastMessage: msg.message,
                    lastMessageType: msg.type,
                    lastTime: msg.createdAt,
                    senderId: msg.senderId,
                    unreadCount: (msg.recipientId === userId && !msg.isRead) ? 1 : 0
                });
            } else if (msg.recipientId === userId && !msg.isRead) {
                chatMap.get(partnerId).unreadCount++;
            }
        }

        const chats = Array.from(chatMap.values());
        if (chats.length === 0) return [];

        const otherUserIds = chats.map(c => c.partnerId);
        const usersInfo = await this.usersRepository.find({
            where: { userId: In(otherUserIds) },
            select: ['userId', 'fullName', 'avatarUrl', 'email'],
        });

        const userMap = new Map(usersInfo.map(u => [u.userId, u]));

        return chats.map((chat) => {
            const userInfo = userMap.get(chat.partnerId);
            return {
                oderId: chat.partnerId,
                name: userInfo?.fullName || 'Unknown User',
                avatar: userInfo?.avatarUrl || null,
                email: userInfo?.email || '',
                lastMessage: chat.lastMessageType === 'voice' ? '🎤 Voice message' : (chat.lastMessage || ''),
                lastTime: chat.lastTime,
                senderId: chat.senderId,
                unreadCount: chat.unreadCount,
            };
        });
    }

    async markAsRead(userId: string, otherId: string) {
        const result = await this.chatRepository.update(
            { senderId: otherId, recipientId: userId, isRead: false },
            { isRead: true }
        );

        this.gateway.notifyMessagesRead(otherId, userId);
        return { modifiedCount: result.affected };
    }

    async deleteMessage(messageId: string) {
        const msg = await this.chatRepository.findOne({ where: { _id: messageId } });
        if (msg) {
            await this.chatRepository.delete(messageId);
            this.gateway.emitToRoom(`user_${msg.recipientId}`, 'message_deleted', { messageId });
            this.gateway.emitToRoom(`user_${msg.senderId}`, 'message_deleted', { messageId });
        }
        return { success: true };
    }

    async searchUsers(query: string, currentUserId: string) {
        if (!query || query.trim().length < 2) return [];

        const users = await this.usersRepository.find({
            where: [
                { fullName: ILike(`%${query}%`), isActive: true },
                { email: ILike(`%${query}%`), isActive: true },
            ],
            select: ['userId', 'fullName', 'avatarUrl', 'email'],
            take: 20,
        });

        return users.filter(u => u.userId !== currentUserId);
    }

    async updateMessage(messageId: string, content: string) {
        await this.chatRepository.update(messageId, { message: content });
        const updated = await this.chatRepository.findOne({ where: { _id: messageId } });
        if (updated) {
            this.gateway.notifyNewP2PMessage(updated.recipientId, updated);
            this.gateway.notifyNewP2PMessage(updated.senderId, updated);
        }
        return updated;
    }

    async getUserInfo(userId: string) {
        return await this.usersRepository.findOne({
            where: { userId },
            select: ['userId', 'fullName', 'avatarUrl', 'email'],
        });
    }

    async getUsersInfo(userIds: string[]) {
        if (!userIds || userIds.length === 0) return [];
        return await this.usersRepository.find({
            where: { userId: In(userIds) },
            select: ['userId', 'fullName', 'avatarUrl', 'email'],
        });
    }

    // AI/Bot Methods (Adapted from previous logic to keep AI working if needed)
    async addMessage(userId: string, sessionId: string, messageData: any) {
        // System bot messages can also be stored in Postgres now
        const newMessage = this.chatRepository.create({
            senderId: messageData.sender === 'bot' ? 'system_bot' : userId,
            recipientId: messageData.sender === 'bot' ? userId : 'system_bot',
            message: messageData.content,
            type: messageData.type,
            clientId: messageData.clientId
        });

        const saved = await this.chatRepository.save(newMessage);
        
        // Use the generic session room for bot conversations if needed
        this.gateway.emitToRoom(`session_${sessionId}`, 'new_p2p_message', saved);
        
        return saved;
    }

    async getSessionMessages(sessionId: string, page: number = 1, limit: number = 20) {
        // For backwards compatibility with AI sessions
        return await this.chatRepository.find({
            where: [
                { senderId: 'system_bot', recipientId: sessionId }, // sessionId used as a pseudo user id for bots
                { senderId: sessionId, recipientId: 'system_bot' }
            ],
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit
        });
    }
}
