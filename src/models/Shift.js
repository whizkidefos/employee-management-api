import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  facility: {
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true }
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  requiredRole: {
    type: String,
    enum: ['Registered Nurse', 'Healthcare Assistant', 'Support Worker'],
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'cancelled'],
    default: 'available'
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkedInAt: {
    type: Date
  },
  checkedOutAt: {
    type: Date
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate duration in hours
shiftSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  return (endHour + endMinute/60) - (startHour + startMinute/60);
});

// Calculate total pay
shiftSchema.virtual('totalPay').get(function() {
  return this.duration * this.rate;
});

// Ensure virtuals are included in JSON output
shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

export default mongoose.model('Shift', shiftSchema);