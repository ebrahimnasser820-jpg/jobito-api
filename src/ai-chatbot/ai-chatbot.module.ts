import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiChatbotService } from './ai-chatbot.service.js';
import { AiChatbotController } from './ai-chatbot.controller.js';
import { MonitoringModule } from '../monitoring/monitoring.module.js';

@Module({
  imports: [
    HttpModule,
    MonitoringModule,
  ],
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
  exports: [AiChatbotService],
})
export class AiChatbotModule {}
