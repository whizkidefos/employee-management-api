import webSocketService from './websocket.js';
import { sendEmail } from './email.js';
import { sendSMS } from './sms.js';
import User from '../models/User.js';

class NotificationService {
  constructor(webSocketService) {
    this.webSocketService = webSocketService;
  }

  async sendNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Send real-time notification
      this.webSocketService.sendToUser(userId, {
        type: 'NOTIFICATION',
        data: notification
      });

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
}

export default NotificationService;