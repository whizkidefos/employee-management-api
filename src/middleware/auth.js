import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { UnauthorizedError, ForbiddenError } from './error.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId, isVerified: true });

    if (!user) {
      throw new UnauthorizedError('User not found or not verified');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(401).json({ error: 'Please authenticate.' });
    }
  }
};

export const admin = async (req, res, next) => {
  try {
    // First run the auth middleware
    await new Promise((resolve, reject) => {
      auth(req, res, (error) => {
        if (error) reject(error);
        resolve();
      });
    });

    if (!req.user.isAdmin) {
      throw new ForbiddenError('Admin access required');
    }
    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(403).json({ error: 'Admin access required.' });
    }
  }
};

// Role-based middleware generator
export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      // First run the auth middleware
      await new Promise((resolve, reject) => {
        auth(req, res, (error) => {
          if (error) reject(error);
          resolve();
        });
      });

      if (!roles.includes(req.user.jobRole)) {
        throw new ForbiddenError('Insufficient role permissions');
      }
      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(403).json({ error: 'Access denied.' });
      }
    }
  };
};