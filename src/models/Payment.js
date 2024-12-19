import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'gbp'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'stripe', 'other'],
    required: true
  },
  stripePaymentId: String,
  description: String,
  metadata: {
    type: Map,
    of: String
  },
  refundReason: String,
  refundedAt: Date,
  paidAt: Date
}, {
  timestamps: true
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Add indexes for common queries
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ shift: 1 });
paymentSchema.index({ createdAt: -1 });

// Ensure virtuals are included in JSON output
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Payment', paymentSchema);
