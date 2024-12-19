import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const profileUploadsDir = path.join(uploadsDir, 'profiles');
const documentUploadsDir = path.join(uploadsDir, 'documents');

[profileUploadsDir, documentUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Configure storage based on environment
let profileStorage;
let documentStorage;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME) {
  // Configure AWS
  aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });

  const s3 = new aws.S3();

  // S3 Storage
  profileStorage = multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'private',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `profiles/${Date.now()}_${path.basename(file.originalname)}`;
      cb(null, fileName);
    }
  });

  documentStorage = multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'private',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `documents/${Date.now()}_${path.basename(file.originalname)}`;
      cb(null, fileName);
    }
  });

  logger.info('Using AWS S3 storage for file uploads');
} else {
  // Local Storage
  profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, profileUploadsDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${path.basename(file.originalname)}`);
    }
  });

  documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, documentUploadsDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${path.basename(file.originalname)}`);
    }
  });

  logger.info('Using local storage for file uploads');
}

// Configure multer for different upload types
export const uploadProfile = multer({
  storage: profileStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('profilePhoto');

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('document');