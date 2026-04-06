import { Controller, Post, Body, Req, UseGuards, Request } from '@nestjs/common';
import { AiChatbotService } from './ai-chatbot.service.js';

@Controller('ai-chatbot')
export class AiChatbotController {
  constructor(private readonly chatbotService: AiChatbotService) {}

  @Post('chat')
  async chat(@Body() data: { message: string; userId?: string }) {
    const { message, userId } = data;
    return await this.chatbotService.getChatResponse(message, userId || 'guest');
  }
}
