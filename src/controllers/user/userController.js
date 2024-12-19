import User from '../../models/User.js';
import logger from '../../utils/logger.js';
import notificationService from '../../services/notification.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ error: 'Error retrieving users' });
  }
};

// Get user by ID (admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Error getting user:', error);
    res.status(500).json({ error: 'Error retrieving user' });
  }
};

// Create user (admin only)
export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User created successfully', user: user.toJSON() });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
};

// Get user profile (for authenticated user)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    logger.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Error retrieving user profile' });
  }
};

// Update user profile (for authenticated user)
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('notifications')
      .select('notifications');

    res.json(user.notifications);
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Error retrieving notifications' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = user.notifications.id(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    await user.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error updating notification' });
  }
};

// Register FCM token for push notifications
export const registerFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ message: 'FCM token registered successfully' });
  } catch (error) {
    logger.error('Error registering FCM token:', error);
    res.status(500).json({ error: 'Error registering FCM token' });
  }
};

// Unregister FCM token
export const unregisterFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    user.fcmTokens = user.fcmTokens.filter(t => t !== token);
    await user.save();

    res.json({ message: 'FCM token unregistered successfully' });
  } catch (error) {
    logger.error('Error unregistering FCM token:', error);
    res.status(500).json({ error: 'Error unregistering FCM token' });
  }
};
