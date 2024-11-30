import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  duration: Number, // in minutes
  content: String,
  order: { type: Number, required: true }
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
  thumbnail: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Course = mongoose.model('Course', courseSchema);
export default Course;