import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

let s3Client;

// Initialize S3 if credentials are available
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  logger.info('AWS S3 initialized');
} else {
  logger.info('AWS S3 not configured, using local storage');
}

export const uploadToS3 = async (file, folder) => {
  if (s3Client) {
    try {
      const key = `${folder}/${Date.now()}_${path.basename(file.originalname)}`;
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private'
      });

      await s3Client.send(command);
      return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw new Error('File upload failed');
    }
  } else {
    // Local storage fallback
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.promises.writeFile(filePath, file.buffer);
      return `/uploads/${folder}/${fileName}`;
    } catch (error) {
      logger.error('Error saving file locally:', error);
      throw new Error('File upload failed');
    }
  }
};

export const deleteFromS3 = async (fileUrl) => {
  if (s3Client) {
    try {
      // Extract the key from the file URL
      const key = fileUrl.split('.com/')[1];
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      });

      await s3Client.send(command);
      logger.info('File deleted from S3:', key);
    } catch (error) {
      logger.error('Error deleting from S3:', error);
      throw new Error('File deletion failed');
    }
  } else {
    // Local storage fallback
    try {
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info('File deleted locally:', filePath);
      }
    } catch (error) {
      logger.error('Error deleting file locally:', error);
      throw new Error('File deletion failed');
    }
  }
};

export const getSignedUrl = async (fileUrl, expiresIn = 3600) => {
  if (s3Client) {
    try {
      // Extract the key from the file URL
      const key = fileUrl.split('.com/')[1];
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      });

      const signedUrl = await getS3SignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error('Failed to generate download URL');
    }
  } else {
    // For local storage, just return the file URL
    return fileUrl;
  }
};