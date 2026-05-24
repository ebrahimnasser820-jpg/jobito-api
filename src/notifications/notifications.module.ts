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
  ],
  controllers: [PushController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
