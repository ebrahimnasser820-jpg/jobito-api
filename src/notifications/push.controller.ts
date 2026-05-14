import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { PushService } from './push.service.js';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  // ─── Register FCM Token (Mobile) ────────────────────────────────
  @Post('register/fcm')
  async registerFCM(
    @Body() body: { userId: string; deviceToken: string; deviceName?: string },
  ) {
    return this.pushService.registerFCMToken(body.userId, body.deviceToken, body.deviceName);
  }

  // ─── Register Web Push Subscription (Browser) ───────────────────
  @Post('register/web')
  async registerWebPush(
    @Body() body: { userId: string; subscription: object; deviceName?: string },
  ) {
    return this.pushService.registerWebPushSubscription(body.userId, body.subscription, body.deviceName);
  }

  // ─── Unregister a Subscription ──────────────────────────────────
  @Delete('unregister/:subscriptionId')
  async unregister(
    @Param('subscriptionId') subscriptionId: string,
    @Query('userId') userId: string,
  ) {
    return this.pushService.unregister(userId, Number(subscriptionId));
  }

  // ─── Get User's Active Subscriptions ────────────────────────────
  @Get('subscriptions/:userId')
  async getSubscriptions(@Param('userId') userId: string) {
    return this.pushService.getUserSubscriptions(userId);
  }

  // ─── Send Push to Specific User (Admin/System use) ──────────────
  @Post('send')
  async sendPush(
    @Body() body: { userId: string; title: string; body: string; data?: Record<string, string> },
  ) {
    return this.pushService.sendPushToUser(body.userId, body.title, body.body, body.data);
  }

  // ─── Broadcast Push to Multiple Users ───────────────────────────
  @Post('broadcast')
  async broadcast(
    @Body() body: { userIds: string[]; title: string; body: string; data?: Record<string, string> },
  ) {
    return this.pushService.sendPushToMany(body.userIds, body.title, body.body, body.data);
  }

  // ─── Get VAPID Public Key (for frontend to use) ─────────────────
  @Get('vapid-key')
  getVapidKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY || '' };
  }
}
