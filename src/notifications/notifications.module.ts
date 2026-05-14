import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { PushService } from './push.service.js';
import { PushController } from './push.controller.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MailModule } from '../mail/mail.module.js';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity.js';
import { PushSubscription } from './entities/push-subscription.entity.js';

@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature([Notification, PushSubscription]),
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
  controllers: [PushController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService, ClientsModule],
})
export class NotificationsModule {}
