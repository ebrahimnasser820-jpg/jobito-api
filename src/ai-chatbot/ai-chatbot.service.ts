import { Injectable, Logger, InternalServerErrorException, Inject, Res } from '@nestjs/common';
import { DataSource } from 'typeorm';
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
  private readonly pythonUrl = process.env.PYTHON_CHATBOT_URL;

  constructor(
    private readonly httpService: HttpService,
    private readonly logsService: LogsService,
    @InjectModel(AiConversation.name) private aiConversationModel: Model<AiConversation>,
    private dataSource: DataSource,
  ) {}

  async getChatResponse(message: string, userId: string = 'guest', res: Response, image?: string, fileType?: string) {
    try {
      this.logger.debug(`Streaming from Python AI for user ${userId}: ${message} (File: ${fileType})`);
      
      // 1. Fetch history
      let history: { role: string; content: string }[] = [];
      try {
        const conversation = await this.aiConversationModel.findOne({ userId }).exec();
        history = conversation ? conversation.messages.map(m => ({ role: m.role, content: m.content })) : [];
      } catch (e) {
        this.logger.warn(`MongoDB history fetch failed: ${e.message}`);
      }

      // 1.5 Extract Dynamic DB Schemas
      let dynamicDbRules = '';
      try {
        const userMeta = this.dataSource.getMetadata('User');
        const userFields = userMeta.columns.map(c => `${c.propertyName} (${c.type})`).join(', ');

        const companyMeta = this.dataSource.getMetadata('Company');
        const companyFields = companyMeta.columns.map(c => `${c.propertyName} (${c.type})`).join(', ');

        const jobMeta = this.dataSource.getMetadata('Job');
        const jobFields = jobMeta.columns.map(c => `${c.propertyName} (${c.type})`).join(', ');

        dynamicDbRules = `
[هيكل البيانات الفعلي في النظام - Database Schemas]
استخدم هذه الحقول لتخبر المستخدم بما يجب عليه ملؤه بدقة:
- البيانات المطلوبة لتسجيل مستخدم (User Table): ${userFields}
- البيانات المطلوبة لتسجيل شركة (Company Table): ${companyFields}
- البيانات المطلوبة لنشر وظيفة (Job Table): ${jobFields}
`;
      } catch (err) {
        this.logger.warn(`Failed to extract DB metadata: ${err.message}`);
      }

      // 2. Call Python ChatBot with Streaming
      const systemInstruction = `[تعليمات هامة: أنت "المساعد الذكي لجوبيتو" (Jobito AI Assistant)، المساعد الخاص بمنصة Jobito للعمل الجزئي.
تخصصك الوحيد هو مساعدة المستخدمين داخل المنصة والإجابة عن الأسئلة المتعلقة بالوظائف، فكرة المشروع، كيفية استخدام الموقع، شروط التسجيل، وإعطاء نصائح مهنية.
إذا سألك أحد "من أنت؟" أو "ما هو تخصصك؟"، أجب بفخر أنك المساعد الذكي لمنصة جوبيتو، ومهمتك هي تسهيل رحلة التوظيف والعمل الحر على المنصة.

معلومات هامة عن المنصة لمساعدتك في الإجابة:
1. الباحث عن عمل (Job Seeker): يحتاج للتسجيل بالبريد الإلكتروني وتفعيله عبر رمز OTP.
2. مقدم الخدمة (Tradesman/صنايعي): يحتاج للتسجيل بالبريد وتفعيله عبر OTP، ولتفعيل حسابه بالكامل يجب عليه رفع الفيش والتشبيه (صحيفة الحالة الجنائية)، وسيتم مراجعته من قبل الإدارة.
3. الشركة (Company): تحتاج للتسجيل بالبريد وتفعيله عبر OTP، ولن يتم تفعيل الحساب إلا بعد رفع السجل التجاري والبطاقة الضريبية ومراجعتها.

تحذير: أنت لست ذكاءً اصطناعياً عاماً (مثل ChatGPT). إذا سألك المستخدم عن أي موضوع عام خارج نطاق التوظيف أو منصة جوبيتو (مثل البرمجة، التاريخ، الطبخ، إلخ)، يجب أن تعتذر وترد بهذه الجملة فقط: "أنا المساعد الذكي لمنصة جوبيتو المتخصص في الوظائف والخدمات فقط، ولا يمكنني الإجابة على هذا السؤال."]
${dynamicDbRules}`;
      const enrichedMessage = `${systemInstruction}\n\nرسالة المستخدم: ${message}`;

      const response = await axios.post(this.pythonUrl as string, {
        message: enrichedMessage,
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
              await this.saveToMongo(userId, message, fullReply);
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
        this.logger.error(`AI Service Error (${error.response.status}): ${error.message}`);
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
