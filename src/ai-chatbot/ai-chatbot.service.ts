import { Injectable, Logger, InternalServerErrorException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LogsService } from '../monitoring/services/logs.service.js';

@Injectable()
export class AiChatbotService {
  private readonly logger = new Logger(AiChatbotService.name);
  private readonly pythonUrl = process.env.PYTHON_CHATBOT_URL || 'http://localhost:5000/chat';

  constructor(
    private readonly httpService: HttpService,
    private readonly logsService: LogsService,
  ) {}

  async getChatResponse(message: string, userId: string = 'guest') {
    try {
      this.logger.debug(`Sending message to Python AI: ${message}`);
      
      const response = await firstValueFrom(
        this.httpService.post(this.pythonUrl, {
          message,
          user_id: userId,
        }, {
          timeout: 45000, // 45 seconds timeout (Local Generation takes time)
        }),
      );

      return response.data;
    } catch (error) {
      const errorMessage = error.response ? 
        `Python AI Error: ${error.response.status}` : 
        `Python AI Connection Failure: ${error.message}`;

      this.logger.error(errorMessage);

      // Report to Monitoring System (BAM)
      await this.logsService.logError(errorMessage, {
        service: 'Python-AI-Chatbot',
        message_preview: message.substring(0, 50),
        original_error: error.message
      });

      throw new InternalServerErrorException(
        'عذراً، الشات بوت غير متاح حالياً. تم تسجيل المشكلة للمتابعة.'
      );
    }
  }
}
