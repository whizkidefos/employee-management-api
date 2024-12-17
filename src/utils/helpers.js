import crypto from 'crypto';
import path from 'path';

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCurrency = (amount, currency = 'GBP') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency
  }).format(amount);
};

export const calculateHours = (startTime, endTime) => {
  const diff = new Date(endTime) - new Date(startTime);
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
};

export const generateFileName = (originalPath) => {
  const ext = path.extname(originalPath);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

export const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
};

export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9.]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
};