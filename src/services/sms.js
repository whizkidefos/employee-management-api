import twilio from 'twilio';
import logger from '../utils/logger.js';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendVerificationCode = async (phoneNumber) => {
  try {
    const verification = await client.verify.v2
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
  try {
    const verification = await client.verify.v2
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
  try {
    const response = await client.messages.create({
      body: message,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    return response.sid;
  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw new Error('Error sending SMS');
  }
};