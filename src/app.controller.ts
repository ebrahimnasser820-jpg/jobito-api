import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('') // Adding a new endpoint for the root path
  getRoot() {
    return { message: 'API is working' };
  }

  @Get('config')
  getPublicConfig() {
    return {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    };
  }
}
