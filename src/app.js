import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import logger from './utils/logger.js';
import notificationService from './services/notification.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import profileRoutes from './routes/profile.js';
import paymentRoutes from './routes/payment.js';
import scheduleRoutes from './routes/schedule.js';
import trainingRoutes from './routes/training.js';
import documentRoutes from './routes/document.js';

// Import middleware
import { errorHandler } from './middleware/error.js';

// Import Swagger configuration
import { swaggerDocs } from './config/swagger.js';

// Configure express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/documents', documentRoutes);

// Swagger documentation
swaggerDocs(app);

// Error handling
app.use(errorHandler);

// Connect to MongoDB
const mongoUri = process.env.NODE_ENV === 'test' 
  ? process.env.MONGODB_TEST_URI 
  : process.env.MONGODB_URI;

if (!mongoUri) {
  logger.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 3300;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;