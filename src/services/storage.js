import aws from 'aws-sdk';
import { generateFileName } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export const uploadToS3 = async (filePath, buffer, contentType) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: generateFileName(filePath),
      Body: buffer,
      ContentType: contentType,
      ACL: 'private'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error('File upload failed');
  }
};

export const getSignedUrl = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Expires: 3600 // URL expires in 1 hour
    };

    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    logger.error('S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
};