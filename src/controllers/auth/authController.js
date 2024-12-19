import { generateToken, generateRefreshToken, generatePasswordResetToken, generatePhoneVerificationToken } from '../../services/jwt.js';
import { sendVerificationCode, verifyCode } from '../../services/sms.js';
import { sendEmail } from '../../services/email.js';
import User from '../../models/User.js';
import bcrypt from 'bcrypt';

// Register new user
export const register = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();

    // Generate verification token and send SMS
    const verificationToken = generatePhoneVerificationToken(user._id, user.phoneNumber);
    await sendVerificationCode(user.phoneNumber);

    res.status(201).json({
      message: 'User registered successfully. Please verify your phone number.',
      userId: user._id
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verify phone number
export const verifyPhone = async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await verifyCode(user.phoneNumber, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Phone number verified successfully',
      token,
      refreshToken
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your phone number first' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      },
      token,
      refreshToken
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = generatePasswordResetToken(user._id);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Please click the following link to reset your password: ${resetUrl}`
    });

    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = verifyPasswordResetToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // or remove it from a token whitelist
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
