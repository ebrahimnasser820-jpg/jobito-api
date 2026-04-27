import { Injectable, Logger, InternalServerErrorException, Inject, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import { LogsService } from '../monitoring/services/logs.service.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiConversation } from './schemas/ai-conversation.schema.js';
import type { Response } from 'express';
import axios from 'axios';

@Injectable()
export class AiChatbotService {
  private readonly logger = new Logger(AiChatbotService.name);
  private readonly pythonUrl = process.env.PYTHON_CHATBOT_URL || 'http://localhost:5000/chat';

  constructor(
    private readonly httpService: HttpService,
    private readonly logsService: LogsService,
    @InjectModel(AiConversation.name) private aiConversationModel: Model<AiConversation>,
  ) {}

  async getChatResponse(message: string, userId: string = 'guest', res: Response, image?: string, fileType?: string) {
    try {
      this.logger.debug(`Streaming from Python AI for user ${userId}: ${message} (File: ${fileType})`);
      
      // 1. Fetch history (DISABLED FOR TESTING)
      let history: { role: string; content: string }[] = [];
      /*
      try {
        const conversation = await this.aiConversationModel.findOne({ userId }).exec();
        history = conversation ? conversation.messages.map(m => ({ role: m.role, content: m.content })) : [];
      } catch (e) {
        this.logger.warn(`MongoDB history fetch failed: ${e.message}`);
      }
      */

      // 2. Call Python ChatBot with Streaming
      const response = await axios.post(this.pythonUrl, {
        message,
        user_id: userId,
        history: history.slice(-10),
        image,
        file_type: fileType || 'image',
      }, {
        responseType: 'stream',
        timeout: 120000,
      });

      let fullReply = '';
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.data.on('data', async (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              // await this.saveToMongo(userId, message, fullReply); // DISABLED FOR TESTING
              res.write(`data: [DONE]\n\n`);
              res.end();
            } else {
              try {
                const parsed = JSON.parse(dataStr);
                fullReply += parsed.text;
                res.write(`data: ${JSON.stringify({ text: parsed.text })}\n\n`);
              } catch (e) {}
            }
          }
        }
      });

      response.data.on('error', (err) => {
        this.logger.error(`Stream error: ${err.message}`);
        res.end();
      });

    } catch (error) {
      if (error.response) {
        this.logger.error(`AI Service Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error(`AI Service Error: ${error.message}`);
      }
      try {
        res.status(500).write(`data: ${JSON.stringify({ error: 'عذراً، الشات بوت غير متاح حالياً.' })}\n\n`);
        res.end();
      } catch (e) {}
    }
  }

  async getHistory(userId: string) {
    try {
      const conversation = await this.aiConversationModel.findOne({ userId }).exec();
      return conversation ? conversation.messages : [];
    } catch (e) {
      this.logger.warn(`MongoDB getHistory failed: ${e.message}`);
      return [];
    }
  }

  private async saveToMongo(userId: string, userMessage: string, botReply: string) {
    try {
      const newMessages = [
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: botReply, timestamp: new Date() },
      ];

      await this.aiConversationModel.updateOne(
        { userId },
        { $push: { messages: { $each: newMessages } } },
        { upsert: true }
      ).exec();
    } catch (e) {
      this.logger.error(`Failed to save to Mongo: ${e.message}`);
    }
  }
}
