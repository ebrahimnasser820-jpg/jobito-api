import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { PushSubscription } from './entities/push-subscription.entity.js';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private fcmInitialized = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly pushSubRepo: Repository<PushSubscription>,
  ) {}

  onModuleInit() {
    // ─── Initialize Web Push (VAPID) ───────────────────────────────
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@jobito.com';

    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
      this.logger.log('✅ Web Push (VAPID) initialized successfully');
    } else {
      this.logger.warn('⚠️ VAPID keys not set. Web Push notifications will be disabled. Run: npx web-push generate-vapid-keys');
    }

    // ─── Initialize Firebase Admin SDK ─────────────────────────────
    const firebaseKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const firebaseCredentials = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (firebaseKeyPath) {
      try {
        const fullPath = path.resolve(firebaseKeyPath);
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const serviceAccount = JSON.parse(fileContent);
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
        this.fcmInitialized = true;
        this.logger.log('✅ Firebase Admin SDK (FCM) initialized from file');
      } catch (err) {
        this.logger.error('❌ Failed to initialize Firebase from file:', err.message);
      }
    } else if (firebaseCredentials) {
      try {
        const serviceAccount = JSON.parse(firebaseCredentials);
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
        this.fcmInitialized = true;
        this.logger.log('✅ Firebase Admin SDK (FCM) initialized from env');
      } catch (err) {
        this.logger.error('❌ Failed to initialize Firebase from env:', err.message);
      }
    } else {
      this.logger.warn('⚠️ Firebase credentials not set. FCM push notifications will be disabled.');
    }
  }

  // ─── Register Device/Browser ──────────────────────────────────────

  /**
   * Register an FCM device token (for mobile apps)
   */
  async registerFCMToken(userId: string, deviceToken: string, deviceName?: string) {
    // Check if token already exists
    const existing = await this.pushSubRepo.findOne({
      where: { userId, deviceToken, platform: 'fcm' },
    });

    if (existing) {
      existing.isActive = true;
      existing.deviceName = deviceName || existing.deviceName;
      return this.pushSubRepo.save(existing);
    }

    const sub = this.pushSubRepo.create({
      userId,
      platform: 'fcm',
      deviceToken,
      deviceName: deviceName || null,
    });

    this.logger.log(`📱 FCM token registered for user ${userId}`);
    return this.pushSubRepo.save(sub);
  }

  /**
   * Register a Web Push subscription (for browsers)
   */
  async registerWebPushSubscription(userId: string, subscription: object, deviceName?: string) {
    const endpoint = (subscription as any)?.endpoint;
    if (!endpoint) throw new Error('Invalid Web Push subscription: missing endpoint');

    // Check if this endpoint already exists
    const existing = await this.pushSubRepo
      .createQueryBuilder('ps')
      .where('ps.user_id = :userId', { userId })
      .andWhere('ps.platform = :platform', { platform: 'web' })
      .andWhere("ps.web_subscription->>'endpoint' = :endpoint", { endpoint })
      .getOne();

    if (existing) {
      existing.isActive = true;
      existing.webSubscription = subscription;
      existing.deviceName = deviceName || existing.deviceName;
      return this.pushSubRepo.save(existing);
    }

    const sub = this.pushSubRepo.create({
      userId,
      platform: 'web',
      webSubscription: subscription,
      deviceName: deviceName || null,
    });

    this.logger.log(`🌐 Web Push subscription registered for user ${userId}`);
    return this.pushSubRepo.save(sub);
  }

  /**
   * Unregister a specific device/browser
   */
  async unregister(userId: string, subscriptionId: number) {
    await this.pushSubRepo.update(
      { id: subscriptionId, userId },
      { isActive: false },
    );
    return { success: true };
  }

  // ─── Send Push Notifications ──────────────────────────────────────

  /**
   * Send push notification to ALL devices of a specific user
   */
  async sendPushToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    const subscriptions = await this.pushSubRepo.find({
      where: { userId, isActive: true },
    });

    if (subscriptions.length === 0) {
      this.logger.log(`ℹ️ No active push subscriptions for user ${userId}`);
      return { sent: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        if (sub.platform === 'fcm' && sub.deviceToken) {
          await this.sendFCM(sub, title, body, data);
          sent++;
        } else if (sub.platform === 'web' && sub.webSubscription) {
          await this.sendWebPush(sub, title, body, data);
          sent++;
        }
      } catch (err) {
        failed++;
        this.logger.error(`❌ Push failed for subscription ${sub.id}: ${err.message}`);

        // If the token/subscription is invalid, deactivate it
        if (this.isExpiredError(err)) {
          await this.pushSubRepo.update(sub.id, { isActive: false });
          this.logger.warn(`🗑️ Deactivated expired subscription ${sub.id}`);
        }
      }
    }

    this.logger.log(`📤 Push sent to user ${userId}: ${sent} success, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Send push notification to multiple users (broadcast)
   */
  async sendPushToMany(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    const results = await Promise.allSettled(
      userIds.map(uid => this.sendPushToUser(uid, title, body, data)),
    );

    const totalSent = results
      .filter(r => r.status === 'fulfilled')
      .reduce((acc, r) => acc + (r as PromiseFulfilledResult<any>).value.sent, 0);

    return { totalSent, usersTargeted: userIds.length };
  }

  // ─── Private Senders ──────────────────────────────────────────────

  private async sendFCM(sub: PushSubscription, title: string, body: string, data?: Record<string, string>) {
    if (!this.fcmInitialized) {
      throw new Error('Firebase Admin SDK is not initialized');
    }

    const message: admin.messaging.Message = {
      token: sub.deviceToken!,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    this.logger.debug(`📱 FCM sent successfully: ${response}`);
    return response;
  }

  private async sendWebPush(sub: PushSubscription, title: string, body: string, data?: Record<string, string>) {
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: data?.url || '/',
        ...data,
      },
    });

    const subscription = sub.webSubscription as any;

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      payload,
    );

    this.logger.debug(`🌐 Web Push sent successfully to subscription ${sub.id}`);
  }

  private isExpiredError(err: any): boolean {
    // FCM expired token
    if (err?.code === 'messaging/registration-token-not-registered') return true;
    // Web Push gone (410)
    if (err?.statusCode === 410 || err?.statusCode === 404) return true;
    return false;
  }

  // ─── Utilities ────────────────────────────────────────────────────

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: string) {
    return this.pushSubRepo.find({
      where: { userId, isActive: true },
      select: ['id', 'platform', 'deviceName', 'createdAt'],
    });
  }

  /**
   * Generate VAPID keys (utility - run once)
   */
  static generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }
}
