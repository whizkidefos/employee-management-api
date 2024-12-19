import webSocketService from './websocket.js';
import { sendEmail } from './email.js';
import { sendSMS } from './sms.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import admin from 'firebase-admin';

class NotificationService {
  constructor(webSocketService) {
    this.webSocketService = webSocketService;
    this.isInitialized = false;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        logger.warn('Firebase credentials not found. Push notifications will be disabled.');
        return;
      }

      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      this.messaging = admin.messaging();
      this.isInitialized = true;
      logger.info('Firebase initialized successfully');
    } catch (error) {
      logger.error('Error initializing Firebase:', error);
      this.isInitialized = false;
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
        await this.sendMulticastNotification(user.fcmTokens, notification.subject || 'New Notification', notification.message, notification.data);
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

  async sendPushNotification(token, title, body, data = {}) {
    if (!this.isInitialized) {
      logger.warn('Firebase not initialized. Skipping push notification.');
      return;
    }

    try {
      const message = {
        notification: {
          title,
          body
        },
        data,
        token
      };

      const response = await this.messaging.send(message);
      logger.info('Successfully sent message:', response);
      return response;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw new Error('Failed to send push notification');
    }
  }

  async sendMulticastNotification(tokens, title, body, data = {}) {
    if (!this.isInitialized) {
      logger.warn('Firebase not initialized. Skipping multicast notification.');
      return;
    }

    try {
      const message = {
        notification: {
          title,
          body
        },
        data,
        tokens
      };

      const response = await this.messaging.sendMulticast(message);
      logger.info('Successfully sent multicast message:', response);
      return response;
    } catch (error) {
      logger.error('Error sending multicast notification:', error);
      throw new Error('Failed to send multicast notification');
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

  async subscribeToTopic(token, topic) {
    if (!this.isInitialized) {
      logger.warn('Firebase not initialized. Skipping topic subscription.');
      return;
    }

    try {
      const response = await this.messaging.subscribeToTopic(token, topic);
      logger.info('Successfully subscribed to topic:', response);
      return response;
    } catch (error) {
      logger.error('Error subscribing to topic:', error);
      throw new Error('Failed to subscribe to topic');
    }
  }

  async unsubscribeFromTopic(token, topic) {
    if (!this.isInitialized) {
      logger.warn('Firebase not initialized. Skipping topic unsubscription.');
      return;
    }

    try {
      const response = await this.messaging.unsubscribeFromTopic(token, topic);
      logger.info('Successfully unsubscribed from topic:', response);
      return response;
    } catch (error) {
      logger.error('Error unsubscribing from topic:', error);
      throw new Error('Failed to unsubscribe from topic');
    }
  }

  async sendTopicMessage(topic, title, body, data = {}) {
    if (!this.isInitialized) {
      logger.warn('Firebase not initialized. Skipping topic message.');
      return;
    }

    try {
      const message = {
        notification: {
          title,
          body
        },
        data,
        topic
      };

      const response = await this.messaging.send(message);
      logger.info('Successfully sent topic message:', response);
      return response;
    } catch (error) {
      logger.error('Error sending topic message:', error);
      throw new Error('Failed to send topic message');
    }
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;