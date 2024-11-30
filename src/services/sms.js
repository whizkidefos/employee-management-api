import twilio from 'twilio';

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
    throw new Error('Error verifying code');
  }
};