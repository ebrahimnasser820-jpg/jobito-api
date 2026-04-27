import { Controller, Post, Body, Res, Get, Param } from '@nestjs/common';
import { AiChatbotService } from './ai-chatbot.service.js';
import type { Response } from 'express';

@Controller('ai-chatbot')
export class AiChatbotController {
  constructor(private readonly chatbotService: AiChatbotService) {}

  @Post('chat')
  async chat(
    @Body('message') message: string,
    @Body('userId') userId: string,
    @Body('image') image: string,
    @Body('fileType') fileType: string,
    @Res() res: Response,
  ) {
    return this.chatbotService.getChatResponse(message, userId || 'guest', res, image, fileType);
  }

  @Get('history/:userId')
  async getHistory(@Param('userId') userId: string) {
    return await this.chatbotService.getHistory(userId);
  }
}
