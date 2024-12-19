import Stripe from 'stripe';
import User from '../../models/User.js';
import Payment from '../../models/Payment.js';
import logger from '../../utils/logger.js';
import notificationService from '../../services/notification.js';

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  logger.info('Stripe initialized');
} else {
  logger.warn('Stripe secret key not found. Payment features will be disabled.');
}

// Get user's bank details
export const getBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bankDetails');
    res.json(user.bankDetails);
  } catch (error) {
    logger.error('Error getting bank details:', error);
    res.status(500).json({ error: 'Error retrieving bank details' });
  }
};

// Update user's bank details
export const updateBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.bankDetails = req.body;
    await user.save();

    // Send notification
    await notificationService.sendNotification(user.id, {
      type: 'BANK_DETAILS_UPDATED',
      subject: 'Bank Details Updated',
      message: 'Your bank details have been successfully updated.'
    });

    res.json({ message: 'Bank details updated successfully', bankDetails: user.bankDetails });
  } catch (error) {
    logger.error('Error updating bank details:', error);
    res.status(500).json({ error: 'Error updating bank details' });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('shift', 'date duration rate');
    res.json(payments);
  } catch (error) {
    logger.error('Error getting payment history:', error);
    res.status(500).json({ error: 'Error retrieving payment history' });
  }
};

// Get specific payment
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('shift', 'date duration rate');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    logger.error('Error getting payment:', error);
    res.status(500).json({ error: 'Error retrieving payment' });
  }
};

// Create payment intent (Stripe)
export const createPaymentIntent = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service is currently unavailable' });
  }

  try {
    const { amount, currency = 'gbp' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency,
      metadata: {
        userId: req.user.id
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Error processing payment' });
  }
};

// Handle Stripe webhook
export const handlePaymentWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service is currently unavailable' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;

        // Create payment record
        const payment = new Payment({
          user: userId,
          amount: paymentIntent.amount / 100, // Convert from smallest currency unit
          currency: paymentIntent.currency,
          status: 'completed',
          stripePaymentId: paymentIntent.id
        });
        await payment.save();

        // Send notification
        const user = await User.findById(userId);
        await notificationService.sendNotification(userId, {
          type: 'PAYMENT_RECEIVED',
          subject: 'Payment Received',
          message: `Payment of ${payment.amount} ${payment.currency.toUpperCase()} has been processed successfully.`
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;

        // Create failed payment record
        const payment = new Payment({
          user: userId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'failed',
          stripePaymentId: paymentIntent.id
        });
        await payment.save();

        // Send notification
        await notificationService.sendNotification(userId, {
          type: 'PAYMENT_FAILED',
          subject: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again or contact support.'
        });

        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
};
