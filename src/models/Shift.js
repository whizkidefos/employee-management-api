import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  role: {
    type: String,
    enum: ['Registered Nurse', 'Healthcare Assistant', 'Support Worker'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkedInAt: {
    type: Date
  },
  checkedOutAt: {
    type: Date
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  payRate: {
    type: Number,
    required: true
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

// Index for querying shifts efficiently
shiftSchema.index({ startTime: 1, status: 1 });
shiftSchema.index({ assignedTo: 1, status: 1 });

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;