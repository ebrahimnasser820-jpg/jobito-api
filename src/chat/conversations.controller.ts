import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
    constructor(private readonly chatService: ChatService) {}

    @Get()
    async getMyConversations(@Req() req: any) {
        return this.chatService.getMyChats(req.user.sub);
    }

    @Get(':id/messages')
    async getConversationMessages(
        @Req() req: any,
        @Param('id') otherId: string,
        @Query('page') page: number = 1
    ) {
        return this.chatService.getP2PHistory(req.user.sub, otherId, Number(page));
    }

    @Post(':id/messages')
    async sendMessage(
        @Req() req: any,
        @Param('id') recipientId: string,
        @Body('content') content: string,
        @Body('type') type?: string,
        @Body('clientId') clientId?: string,
    ) {
        return this.chatService.sendP2PMessage(req.user.sub, recipientId, content, type, clientId);
    }
}
