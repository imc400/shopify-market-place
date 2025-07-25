import { messaging } from '../config/firebase';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendNotificationOptions {
  userId?: string;
  userIds?: string[];
  storeId?: string;
  topic?: string;
}

export class NotificationService {
  async sendToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true, name: true },
      });

      if (!user?.fcmToken) {
        logger.warn(`User ${userId} has no FCM token`);
        return false;
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#6366f1',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.send(message);
      
      await prisma.pushNotification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      logger.info(`Notification sent to user ${userId}: ${response}`);
      return true;
    } catch (error) {
      logger.error(`Error sending notification to user ${userId}:`, error);
      
      await prisma.pushNotification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          status: 'FAILED',
        },
      });

      return false;
    }
  }

  async sendToMultipleUsers(userIds: string[], payload: NotificationPayload): Promise<number> {
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        fcmToken: { not: null },
      },
      select: { id: true, fcmToken: true },
    });

    if (users.length === 0) {
      logger.warn('No users with FCM tokens found');
      return 0;
    }

    const tokens = users.map(user => user.fcmToken!);

    try {
      const message = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#6366f1',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.sendMulticast(message);
      
      const notifications = users.map(user => ({
        userId: user.id,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        status: 'SENT' as const,
        sentAt: new Date(),
      }));

      await prisma.pushNotification.createMany({
        data: notifications,
      });

      logger.info(`Sent ${response.successCount}/${tokens.length} notifications`);
      
      if (response.failureCount > 0) {
        logger.warn(`${response.failureCount} notifications failed to send`);
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            logger.error(`Failed to send to token ${index}: ${resp.error?.message}`);
          }
        });
      }

      return response.successCount;
    } catch (error) {
      logger.error('Error sending batch notifications:', error);
      
      const failedNotifications = users.map(user => ({
        userId: user.id,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        status: 'FAILED' as const,
      }));

      await prisma.pushNotification.createMany({
        data: failedNotifications,
      });

      return 0;
    }
  }

  async sendToStoreSubscribers(storeId: string, payload: NotificationPayload): Promise<number> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        storeId,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, fcmToken: true },
        },
      },
    });

    const userIds = subscriptions
      .filter(sub => sub.user.fcmToken)
      .map(sub => sub.user.id);

    if (userIds.length === 0) {
      logger.warn(`No subscribers with FCM tokens found for store ${storeId}`);
      return 0;
    }

    return this.sendToMultipleUsers(userIds, payload);
  }

  async sendToTopic(topic: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#6366f1',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.send(message);
      logger.info(`Topic notification sent: ${response}`);
      return true;
    } catch (error) {
      logger.error(`Error sending topic notification to ${topic}:`, error);
      return false;
    }
  }

  async subscribeToTopic(fcmToken: string, topic: string): Promise<boolean> {
    try {
      await messaging.subscribeToTopic([fcmToken], topic);
      logger.info(`Subscribed token to topic ${topic}`);
      return true;
    } catch (error) {
      logger.error(`Error subscribing to topic ${topic}:`, error);
      return false;
    }
  }

  async unsubscribeFromTopic(fcmToken: string, topic: string): Promise<boolean> {
    try {
      await messaging.unsubscribeFromTopic([fcmToken], topic);
      logger.info(`Unsubscribed token from topic ${topic}`);
      return true;
    } catch (error) {
      logger.error(`Error unsubscribing from topic ${topic}:`, error);
      return false;
    }
  }

  async getNotificationHistory(userId: string, limit: number = 20): Promise<any[]> {
    const notifications = await prisma.pushNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  }

  async markNotificationAsClicked(notificationId: string): Promise<boolean> {
    try {
      await prisma.pushNotification.update({
        where: { id: notificationId },
        data: {
          clickedAt: new Date(),
          status: 'DELIVERED',
        },
      });
      return true;
    } catch (error) {
      logger.error(`Error marking notification ${notificationId} as clicked:`, error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();