import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  duration: Number, // in minutes
  content: String,
  order: { type: Number, required: true },
  resources: [{
    title: String,
    type: String,
    url: String
  }]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['COSHH', 'Conflict Resolution', 'Domestic Violence', 'Epilepsy Awareness', 'Other']
  },
  requiredRole: {
    type: String,
    enum: ['Registered Nurse', 'Healthcare Assistant', 'Support Worker'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: { // total duration in minutes
    type: Number,
    required: true
  },
  modules: [moduleSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  thumbnail: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for checking if course is full
courseSchema.virtual('isFull').get(function() {
  return this.enrolledUsers.length >= this.maxParticipants;
});

// Virtual for remaining spots
courseSchema.virtual('remainingSpots').get(function() {
  return Math.max(0, this.maxParticipants - this.enrolledUsers.length);
});

// Virtual for enrollment status
courseSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'completed';
  return 'in-progress';
});

// Ensure virtuals are included in JSON output
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

// Add indexes for common queries
courseSchema.index({ startDate: 1, status: 1 });
courseSchema.index({ category: 1, requiredRole: 1 });
courseSchema.index({ instructor: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;