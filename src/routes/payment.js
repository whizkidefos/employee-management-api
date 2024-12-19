import express from 'express';
import { auth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import {
  getBankDetails,
  updateBankDetails,
  getPaymentHistory,
  getPaymentById,
  createPaymentIntent,
  handlePaymentWebhook
} from '../controllers/payment/paymentController.js';

const router = express.Router();

// Bank details routes
router.get('/bank-details', auth, getBankDetails);
router.put('/bank-details', auth, validate(schemas.bankDetails), updateBankDetails);

// Payment history routes
router.get('/history', auth, getPaymentHistory);
router.get('/history/:id', auth, getPaymentById);

// Stripe payment routes
router.post('/create-payment-intent', auth, createPaymentIntent);
router.post('/webhook', handlePaymentWebhook);

export default router;
