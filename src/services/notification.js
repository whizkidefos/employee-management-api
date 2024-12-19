import webSocketService from './websocket.js';
import { sendEmail } from './email.js';
import { sendSMS } from './sms.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import admin from 'firebase-admin';

class NotificationService {
  constructor(webSocketService) {
    this.webSocketService = webSocketService;
    
    // Initialize Firebase Admin for push notifications
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
  }

  async sendNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Send real-time notification via WebSocket
      this.webSocketService.sendToUser(userId, {
        type: 'NOTIFICATION',
        data: notification
      });

      // Send push notification to mobile devices
      if (user.fcmTokens?.length > 0) {
        await this.sendPushNotification(user.fcmTokens, notification);
      }

      // Send email notification
      if (notification.emailNotification !== false) {
        await sendEmail({
          to: user.email,
          subject: notification.subject || 'New Notification',
          text: notification.message
        });
      }

      // Send SMS for urgent notifications
      if (notification.urgent) {
        await sendSMS(user.phoneNumber, notification.message);
      }

      return true;
    } catch (error) {
      logger.error('Notification error:', error);
      throw error;
    }
  }

  async sendPushNotification(fcmTokens, notification) {
    try {
      const message = {
        notification: {
          title: notification.subject || 'New Notification',
          body: notification.message
        },
        data: {
          type: notification.type || 'general',
          ...notification.data
        },
        tokens: fcmTokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(fcmTokens[idx]);
          }
        });
        
        // Remove failed tokens from user's fcmTokens
        if (failedTokens.length > 0) {
          await User.updateMany(
            { fcmTokens: { $in: failedTokens } },
            { $pull: { fcmTokens: { $in: failedTokens } } }
          );
        }
      }

      return response;
    } catch (error) {
      logger.error('Push notification error:', error);
      throw error;
    }
  }

  async registerDeviceToken(userId, fcmToken) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { fcmTokens: fcmToken } },
        { new: true }
      );
      return true;
    } catch (error) {
      logger.error('Device token registration error:', error);
      throw error;
    }
  }

  async unregisterDeviceToken(userId, fcmToken) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { $pull: { fcmTokens: fcmToken } },
        { new: true }
      );
      return true;
    } catch (error) {
      logger.error('Device token unregistration error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
let notificationServiceInstance = null;

export const initializeNotificationService = (webSocketService) => {
  notificationServiceInstance = new NotificationService(webSocketService);
  return notificationServiceInstance;
};

export const getNotificationService = () => {
  if (!notificationServiceInstance) {
    throw new Error('NotificationService not initialized');
  }
  return notificationServiceInstance;
};