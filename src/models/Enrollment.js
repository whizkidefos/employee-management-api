import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedModules: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    completedAt: Date
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  startDate: Date,
  completionDate: Date,
  certificateUrl: String
}, {
  timestamps: true
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;