import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [
    MailModule,
    // Enable this module to behave as a microservice client too
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        },
      },
    ]),
  ],
  controllers: [],
  providers: [NotificationsService],
  exports: [NotificationsService, ClientsModule],
})
export class NotificationsModule {}
