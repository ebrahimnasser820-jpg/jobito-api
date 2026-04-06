import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service.js';
import { MediaService } from './media.service.js';
import { ChatController } from './chat.controller.js';
import { ChatMessage } from './chat-message.entity.js';

import { JobsModule } from '../jobs/jobs.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatMessage]),
        JobsModule,
        NotificationsModule,
        UsersModule,
    ],
    controllers: [ChatController],
    providers: [ChatService, MediaService],
    exports: [ChatService, MediaService],
})
export class ChatModule { }
