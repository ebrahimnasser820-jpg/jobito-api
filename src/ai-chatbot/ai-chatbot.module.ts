import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiChatbotService } from './ai-chatbot.service.js';
import { AiChatbotController } from './ai-chatbot.controller.js';
import { MonitoringModule } from '../monitoring/monitoring.module.js';

import { MongooseModule } from '@nestjs/mongoose';
import { AiConversation, AiConversationSchema } from './schemas/ai-conversation.schema.js';

@Module({
  imports: [
    HttpModule,
    MonitoringModule,
    MongooseModule.forFeature([{ name: AiConversation.name, schema: AiConversationSchema }]),
  ],
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
  exports: [AiChatbotService],
})
export class AiChatbotModule {}
