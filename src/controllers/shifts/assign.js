import Shift from '../../models/Shift.js';
import User from '../../models/User.js';
import { sendNotification } from '../../services/notification.js';

export const assignShift = async (req, res) => {
  try {
    const { shiftId, userId } = req.body;

    const [shift, user] = await Promise.all([
      Shift.findById(shiftId),
      User.findById(userId)
    ]);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (shift.status !== 'open') {
      return res.status(400).json({ error: 'Shift is not available' });
    }

    if (user.jobRole !== shift.role) {
      return res.status(400).json({ error: 'User role does not match shift requirements' });
    }

    shift.assignedTo = userId;
    shift.status = 'assigned';
    await shift.save();

    // Notify user about assignment
    await sendNotification(userId, {
      type: 'SHIFT_ASSIGNED',
      message: `You have been assigned a new shift starting ${shift.startTime}`,
      data: { shiftId }
    });

    res.json({ message: 'Shift assigned successfully', shift });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};