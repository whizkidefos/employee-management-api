import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import http from 'http';
import { initializeNotificationService } from './services/notification.js';
import WebSocketService from './services/websocket.js';

config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   traceWarnings: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Websocket server
const server = http.createServer(app);
const wsService = new WebSocketService(server);
export const notificationService = initializeNotificationService(wsService);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;