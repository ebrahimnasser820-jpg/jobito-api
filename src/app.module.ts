import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { APP_FILTER } from '@nestjs/core';
import { typeOrmConfig } from './database/typeorm.config.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { winstonConfig } from './common/configs/logger.config.js';

// Feature Modules
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { ChatModule } from './chat/chat.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { MailModule } from './mail/mail.module.js';
import { TestimonialsModule } from './testimonials/testimonials.module.js';
import { ImagesModule } from './images/images.module.js';
import { GatewayModule } from './common/gateways/gateway.module.js';
import { SupportModule } from './support/support.module.js';
import { ContentModule } from './content/content.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AiChatbotModule } from './ai-chatbot/ai-chatbot.module.js';
import { MonitoringModule } from './monitoring/monitoring.module.js';
import { TranslationsModule } from './translations/translations.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    TypeOrmModule.forRoot(typeOrmConfig),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/jobito';
        console.log('Attempting to connect to MongoDB');
        return { uri };
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    UsersModule,
    CompaniesModule,
    JobsModule,
    ApplicationsModule,
    ChatModule,
    NotificationsModule,
    AuditLogsModule,
    MailModule,
    TestimonialsModule,
    ImagesModule,
    GatewayModule,
    SupportModule,
    ContentModule,
    FavoritesModule,
    DashboardModule,
    AiChatbotModule,
    MonitoringModule,
    TranslationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
