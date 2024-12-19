import Shift from '../../models/Shift.js';
import User from '../../models/User.js';
import { generateShiftPDF } from '../../services/pdf.js';
import { getNotificationService } from '../../services/notification.js';
import logger from '../../utils/logger.js';

// Create a new shift
export const createShift = async (req, res) => {
  try {
    const shift = new Shift({
      ...req.body,
      createdBy: req.user._id
    });
    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    logger.error('Error creating shift:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all shifts with filters
export const getShifts = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      role,
      assignedTo
    } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) query.status = status;
    if (role) query.role = role;
    if (assignedTo) query.assignedTo = assignedTo;

    const shifts = await Shift.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ startTime: 1 });

    res.json(shifts);
  } catch (error) {
    logger.error('Error getting shifts:', error);
    res.status(400).json({ error: error.message });
  }
};

// Assign shift to user
export const assignShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { userId } = req.body;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user role matches shift role
    if (user.jobRole !== shift.role) {
      return res.status(400).json({ error: 'User role does not match shift role' });
    }

    shift.assignedTo = userId;
    shift.status = 'assigned';
    await shift.save();

    // Send notification to user
    const notificationService = getNotificationService();
    await notificationService.sendNotification(userId, {
      subject: 'New Shift Assignment',
      message: `You have been assigned to a shift from ${shift.startTime} to ${shift.endTime}`,
      emailNotification: true
    });

    res.json(shift);
  } catch (error) {
    logger.error('Error assigning shift:', error);
    res.status(400).json({ error: error.message });
  }
};

// Check in to shift
export const checkIn = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { latitude, longitude } = req.body;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to check in to this shift' });
    }

    shift.checkedInAt = new Date();
    shift.status = 'in-progress';
    shift.currentLocation = {
      lat: latitude,
      lng: longitude,
      lastUpdated: new Date()
    };
    await shift.save();

    res.json(shift);
  } catch (error) {
    logger.error('Error checking in to shift:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update current location
export const updateLocation = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { latitude, longitude } = req.body;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this shift' });
    }

    if (shift.status !== 'in-progress') {
      return res.status(400).json({ error: 'Shift is not in progress' });
    }

    shift.currentLocation = {
      lat: latitude,
      lng: longitude,
      lastUpdated: new Date()
    };
    await shift.save();

    res.json(shift);
  } catch (error) {
    logger.error('Error updating location:', error);
    res.status(400).json({ error: error.message });
  }
};

// Check out from shift
export const checkOut = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { latitude, longitude } = req.body;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to check out from this shift' });
    }

    shift.checkedOutAt = new Date();
    shift.status = 'completed';
    shift.currentLocation = {
      lat: latitude,
      lng: longitude,
      lastUpdated: new Date()
    };
    await shift.save();

    res.json(shift);
  } catch (error) {
    logger.error('Error checking out from shift:', error);
    res.status(400).json({ error: error.message });
  }
};

// Export shifts to PDF
export const exportShiftsPDF = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      format // 'daily', 'weekly', or 'monthly'
    } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (userId) {
      query.assignedTo = userId;
    }

    const shifts = await Shift.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ startTime: 1 });

    const pdfBuffer = await generateShiftPDF(shifts, format);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shifts-${format}-${startDate}-${endDate}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting shifts to PDF:', error);
    res.status(400).json({ error: error.message });
  }
};
