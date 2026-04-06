import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { SupportService } from './support.service.js';

interface ContactDto {
  name: string;
  email: string;
  subject: string;
  website?: string;
  message: string;
  phone?: string;
  preferredContact: string;
}

@Controller('support')
export class SupportController {
  constructor(
    private readonly mailService: MailService,
    private readonly supportService: SupportService,
  ) {}

  @Get('help/categories')
  getCategories() {
    return this.supportService.findAllCategories();
  }

  @Get('help/articles')
  searchArticles(@Query('q') q: string) {
    if (q) return this.supportService.searchArticles(q);
    return [];
  }

  @Get('help/articles/:id')
  getArticle(@Param('id') id: string) {
    return this.supportService.findArticleById(parseInt(id));
  }

  @Post('contact')
  async handleContactRequest(@Body() data: ContactDto) {
    try {
      console.log('Received contact request:', data);
      
      // Send real email to admin
      await this.mailService.sendSupportEmail(data);

      return { 
        success: true, 
        message: 'تم إرسال رسالتك بنجاح وسنتواصل معك قريباً.' 
      };
    } catch (error) {
      console.error('Error handling contact request:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً.'
      };
    }
  }
}
