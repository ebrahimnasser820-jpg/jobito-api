import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { ChatService } from './chat.service.js';
import { MediaService } from './media.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';

// Multer disk storage for chat uploads (audio, images, files)
const chatStorage = diskStorage({
    destination: './uploads/chat',
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname) || '.webm'}`;
        cb(null, uniqueName);
    },
});

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly mediaService: MediaService,
    ) { }

    @Post('message')
    async addMessage(@Body() createMessageDto: CreateMessageDto) {
        const { userId, sessionId, ...messageData } = createMessageDto;
        return this.chatService.addMessage(userId, sessionId, messageData);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { storage: chatStorage }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const fileName = file.filename; // Already saved to disk by multer
        return {
            fileName,
            url: `/chat/media/${fileName}`
        };
    }

    @Post('upload-audio')
    @UseInterceptors(FileInterceptor('file', { storage: chatStorage }))
    async uploadAudio(
        @UploadedFile() file: Express.Multer.File,
        @Body('senderId') senderId: string,
        @Body('recipientId') recipientId: string,
        @Body('duration') duration: string,
        @Body('clientId') clientId?: string,
    ) {
        // File is already saved to disk by multer diskStorage
        const audioUrl = `/chat/media/${file.filename}`;
        
        return this.chatService.saveVoiceMessage(
            senderId,
            recipientId,
            audioUrl,
            parseFloat(duration) || 0,
            clientId,
        );
    }


    @Get('media/:fileName')
    async getMedia(@Param('fileName') fileName: string, @Res() res: Response) {
        const { stream, contentType } = await this.mediaService.getFileStream(fileName);
        res.set('Content-Type', contentType);
        stream.pipe(res);
    }


    @Get('history/:sessionId')
    async getHistory(
        @Param('sessionId') sessionId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.chatService.getSessionMessages(sessionId, Number(page), Number(limit));
    }

    @Post('p2p')
    async sendP2PMessage(@Body() body: { senderId: string, recipientId: string, content: string, type?: string, clientId?: string }) {
        return this.chatService.sendP2PMessage(body.senderId, body.recipientId, body.content, body.type, body.clientId);
    }

    @Delete('p2p/:id')
    async deleteMessage(@Param('id') id: string) {
        return this.chatService.deleteMessage(id);
    }

    // Mark messages as read
    @Put('p2p/read')
    async markMessagesAsRead(@Body() body: { userId: string, otherId: string }) {
        return this.chatService.markAsRead(body.userId, body.otherId);
    }

    @Put('p2p/:id')
    async updateMessage(@Param('id') id: string, @Body('content') content: string) {
        return this.chatService.updateMessage(id, content);
    }

    @Get('p2p/history')
    async getP2PHistory(
        @Query('userId') userId: string,
        @Query('otherId') otherId: string,
        @Query('page') page: number = 1,
    ) {
        return this.chatService.getP2PHistory(userId, otherId, Number(page));
    }

    @Get('my-chats/:userId')
    async getMyChats(@Param('userId') userId: string) {
        return this.chatService.getMyChats(userId);
    }



    // Search users for new chat
    @Get('search-users')
    async searchUsers(@Query('q') query: string, @Query('currentUserId') currentUserId: string) {
        return this.chatService.searchUsers(query, currentUserId);
    }

    // Get user info by ID (for chat display)
    @Get('user-info/:userId')
    async getUserInfo(@Param('userId') userId: string) {
        return this.chatService.getUserInfo(userId);
    }

    // Get user info for multiple IDs (batch)
    @Post('users-info')
    async getUsersInfo(@Body() body: { userIds: string[] }) {
        return this.chatService.getUsersInfo(body.userIds);
    }
}
