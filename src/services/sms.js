import twilio from 'twilio';
import logger from '../utils/logger.js';

let client = null;

const initializeTwilio = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.warn('Twilio credentials not found. SMS features will be disabled.');
    return null;
  }

  try {
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    logger.error('Error initializing Twilio client:', error);
    return null;
  }
};

const getClient = () => {
  if (!client) {
    client = initializeTwilio();
  }
  return client;
};

export const sendVerificationCode = async (phoneNumber) => {
  const twilioClient = getClient();
  if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    logger.warn('Twilio not configured. Skipping SMS verification.');
    return 'pending'; // Return pending to allow development without SMS
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });
    return verification.status;
  } catch (error) {
    logger.error('Error sending verification code:', error);
    throw new Error('Error sending verification code');
  }
};

export const verifyCode = async (phoneNumber, code) => {
  const twilioClient = getClient();
  if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    logger.warn('Twilio not configured. Skipping code verification.');
    return true; // Return true to allow development without SMS
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phoneNumber, code });
    return verification.status === 'approved';
  } catch (error) {
    logger.error('Error verifying code:', error);
    throw new Error('Error verifying code');
  }
};

export const sendSMS = async (phoneNumber, message) => {
  const twilioClient = getClient();
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    logger.warn('Twilio not configured. Skipping SMS send.');
    return true; // Return true to allow development without SMS
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    return result.sid;
  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw new Error('Error sending SMS');
  }
};