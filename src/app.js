import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { initializeNotificationService } from './services/notification.js';
import WebSocketService from './services/websocket.js';
import { specs } from './config/swagger.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import shiftRoutes from './routes/shifts.js';
import courseRoutes from './routes/courses.js';
import profileRoutes from './routes/profile.js';

config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Endpoint-specific rate limits
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: { error: 'Too many login attempts. Please try again later.' }
});

app.use('/api/auth/login', authLimiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  //   useNewUrlParser: true,
  //   traceWarnings: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  logger.info('Connected to MongoDB');
});

// API versioning prefix
const API_VERSION = '/api/v1';

// Routes
app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/shifts`, shiftRoutes);
app.use(`${API_VERSION}/courses`, courseRoutes);
app.use(`${API_VERSION}/profile`, profileRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Employee Management API');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Websocket server
const server = http.createServer(app);
const wsService = new WebSocketService(server);
export const notificationService = initializeNotificationService(wsService);

const PORT = process.env.PORT || 3300;
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

export default app;