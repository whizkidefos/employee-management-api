import express from 'express';
import { validate, schemas } from '../middleware/validation.js';
import {
  register,
  login,
  verifyPhone,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  logout
} from '../controllers/auth/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Authentication routes
router.post('/register', validate(schemas.userRegistration), register);
router.post('/verify-phone', validate(schemas.verifyPhone), verifyPhone);
router.post('/login', validate(schemas.login), login);
router.post('/request-password-reset', validate(schemas.requestPasswordReset), requestPasswordReset);
router.post('/reset-password', validate(schemas.resetPassword), resetPassword);
router.post('/refresh-token', validate(schemas.refreshToken), refreshToken);
router.post('/logout', auth, logout);

export default router;