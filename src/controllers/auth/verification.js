import { sendVerificationCode, verifyCode } from '../../services/sms.js';
import User from '../../models/User.js';

export const requestPhoneVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const status = await sendVerificationCode(phoneNumber);
    res.json({ message: 'Verification code sent', status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPhone = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await verifyCode(phoneNumber, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: 'Phone number verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};