import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map(); // userId -> WebSocket

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  handleConnection(ws, req) {
    try {
      const token = req.url.split('=')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      this.clients.set(decoded.userId, ws);

      ws.on('close', () => {
        this.clients.delete(decoded.userId);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    } catch (error) {
      ws.terminate();
    }
  }

  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  broadcastToAll(data) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

export default WebSocketService;