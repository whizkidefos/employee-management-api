import Shift from '../../models/Shift.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';
import notificationService from '../../services/notification.js';

// Get all shifts
export const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find()
      .populate('facility', 'name location')
      .populate('bookedBy', 'firstName lastName');
    res.json(shifts);
  } catch (error) {
    logger.error('Error getting shifts:', error);
    res.status(500).json({ error: 'Error retrieving shifts' });
  }
};

// Get shift by ID
export const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('facility', 'name location')
      .populate('bookedBy', 'firstName lastName');

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(shift);
  } catch (error) {
    logger.error('Error getting shift:', error);
    res.status(500).json({ error: 'Error retrieving shift' });
  }
};

// Create shift
export const createShift = async (req, res) => {
  try {
    const shift = new Shift({
      ...req.body,
      createdBy: req.user.id
    });
    await shift.save();

    // Notify relevant users about new shift
    const users = await User.find({
      jobRole: shift.requiredRole,
      'preferences.locations': shift.facility.location
    });

    for (const user of users) {
      await notificationService.sendNotification(user.id, {
        type: 'NEW_SHIFT',
        subject: 'New Shift Available',
        message: `A new ${shift.requiredRole} shift is available at ${shift.facility.name}`,
        data: { shiftId: shift.id }
      });
    }

    res.status(201).json(shift);
  } catch (error) {
    logger.error('Error creating shift:', error);
    res.status(500).json({ error: 'Error creating shift' });
  }
};

// Update shift
export const updateShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Notify booked user if shift details changed
    if (shift.bookedBy) {
      await notificationService.sendNotification(shift.bookedBy, {
        type: 'SHIFT_UPDATED',
        subject: 'Shift Updated',
        message: 'A shift you are booked for has been updated',
        data: { shiftId: shift.id }
      });
    }

    res.json(shift);
  } catch (error) {
    logger.error('Error updating shift:', error);
    res.status(500).json({ error: 'Error updating shift' });
  }
};

// Delete shift
export const deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Notify booked user if shift is cancelled
    if (shift.bookedBy) {
      await notificationService.sendNotification(shift.bookedBy, {
        type: 'SHIFT_CANCELLED',
        subject: 'Shift Cancelled',
        message: 'A shift you were booked for has been cancelled',
        data: { shiftId: shift.id }
      });
    }

    await shift.remove();
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    logger.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Error deleting shift' });
  }
};

// Book shift
export const bookShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.bookedBy) {
      return res.status(400).json({ error: 'Shift already booked' });
    }

    // Check if user is qualified for the shift
    const user = await User.findById(req.user.id);
    if (user.jobRole !== shift.requiredRole) {
      return res.status(400).json({ error: 'You are not qualified for this shift' });
    }

    shift.bookedBy = req.user.id;
    shift.status = 'booked';
    await shift.save();

    // Send confirmation notification
    await notificationService.sendNotification(req.user.id, {
      type: 'SHIFT_BOOKED',
      subject: 'Shift Booked Successfully',
      message: `You have successfully booked a shift at ${shift.facility.name}`,
      data: { shiftId: shift.id }
    });

    res.json({ message: 'Shift booked successfully', shift });
  } catch (error) {
    logger.error('Error booking shift:', error);
    res.status(500).json({ error: 'Error booking shift' });
  }
};

// Cancel shift booking
export const cancelShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (!shift.bookedBy || shift.bookedBy.toString() !== req.user.id) {
      return res.status(400).json({ error: 'You have not booked this shift' });
    }

    shift.bookedBy = null;
    shift.status = 'available';
    await shift.save();

    // Notify relevant users about shift becoming available
    const users = await User.find({
      jobRole: shift.requiredRole,
      'preferences.locations': shift.facility.location
    });

    for (const user of users) {
      await notificationService.sendNotification(user.id, {
        type: 'SHIFT_AVAILABLE',
        subject: 'Shift Available',
        message: `A ${shift.requiredRole} shift has become available at ${shift.facility.name}`,
        data: { shiftId: shift.id }
      });
    }

    res.json({ message: 'Shift booking cancelled successfully', shift });
  } catch (error) {
    logger.error('Error cancelling shift:', error);
    res.status(500).json({ error: 'Error cancelling shift' });
  }
};

// Get user's booked shifts
export const getMyShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({ bookedBy: req.user.id })
      .populate('facility', 'name location')
      .sort({ date: 1 });
    res.json(shifts);
  } catch (error) {
    logger.error('Error getting user shifts:', error);
    res.status(500).json({ error: 'Error retrieving shifts' });
  }
};

// Get shift availability for a date
export const getShiftAvailability = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const shifts = await Shift.find({
      date: {
        $gte: new Date(date.setHours(0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59))
      },
      status: 'available'
    }).populate('facility', 'name location');
    res.json(shifts);
  } catch (error) {
    logger.error('Error getting shift availability:', error);
    res.status(500).json({ error: 'Error retrieving shifts' });
  }
};

// Get shifts by date
export const getShiftsByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const shifts = await Shift.find({
      date: {
        $gte: new Date(date.setHours(0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59))
      }
    })
      .populate('facility', 'name location')
      .populate('bookedBy', 'firstName lastName');
    res.json(shifts);
  } catch (error) {
    logger.error('Error getting shifts by date:', error);
    res.status(500).json({ error: 'Error retrieving shifts' });
  }
};

// Get shifts by location
export const getShiftsByLocation = async (req, res) => {
  try {
    const shifts = await Shift.find({
      'facility.location': req.params.location
    })
      .populate('facility', 'name location')
      .populate('bookedBy', 'firstName lastName')
      .sort({ date: 1 });
    res.json(shifts);
  } catch (error) {
    logger.error('Error getting shifts by location:', error);
    res.status(500).json({ error: 'Error retrieving shifts' });
  }
};
