import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const referenceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
});

const trainingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passed: { type: Boolean, default: false },
  datePassed: { type: Date }
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  jobRole: {
    type: String,
    enum: ['Registered Nurse', 'Healthcare Assistant', 'Support Worker'],
    required: true
  },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  address: {
    postcode: { type: String, required: true },
    street: { type: String, required: true },
    country: { type: String, required: true }
  },
  hasUnspentConvictions: { type: Boolean, required: true },
  nationalInsuranceNumber: { type: String, required: true, unique: true },
  enhancedDBS: {
    has: { type: Boolean, required: true },
    document: { type: String }
  },
  nationality: {
    type: String,
    enum: ['UK', 'EU', 'Other'],
    required: true
  },
  rightToWork: { type: Boolean, required: true },
  brpNumber: { type: String },
  brpDocument: { type: String },
  references: [referenceSchema],
  workHistory: { type: String },
  consent: { type: Boolean, required: true },
  cvDocument: { type: String },
  trainings: [trainingSchema],
  otherTrainings: [{
    name: { type: String },
    datePassed: { type: Date }
  }],
  combinedCertificate: { type: String },
  bankDetails: {
    sortCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true }
  },
  signature: {
    content: { type: String, required: true },
    date: { type: Date, required: true }
  },
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;