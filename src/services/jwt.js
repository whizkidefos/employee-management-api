import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

export const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_PASSWORD_RESET_SECRET,
    { expiresIn: '1h' }
  );
};

export const generatePhoneVerificationToken = (userId, phoneNumber) => {
  return jwt.sign(
    { userId, phoneNumber },
    process.env.JWT_PHONE_VERIFICATION_SECRET,
    { expiresIn: '10m' }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

export const verifyPasswordResetToken = (token) => {
  return jwt.verify(token, process.env.JWT_PASSWORD_RESET_SECRET);
};

export const verifyPhoneVerificationToken = (token) => {
  return jwt.verify(token, process.env.JWT_PHONE_VERIFICATION_SECRET);
};