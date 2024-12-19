import express from 'express';
import { auth, admin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  getUserNotifications,
  markNotificationAsRead,
  registerFCMToken,
  unregisterFCMToken
} from '../controllers/user/userController.js';

const router = express.Router();

// Admin routes
router.get('/', auth, admin, getAllUsers);
router.post('/', auth, admin, validate(schemas.userCreate), createUser);
router.get('/:id', auth, admin, getUserById);
router.put('/:id', auth, admin, validate(schemas.userUpdate), updateUser);
router.delete('/:id', auth, admin, deleteUser);

// User profile routes
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, validate(schemas.profileUpdate), updateUserProfile);

// Notification routes
router.get('/notifications', auth, getUserNotifications);
router.put('/notifications/:id/read', auth, markNotificationAsRead);

// FCM token routes
router.post('/fcm-token', auth, validate(schemas.fcmToken), registerFCMToken);
router.delete('/fcm-token', auth, validate(schemas.fcmToken), unregisterFCMToken);

export default router;
