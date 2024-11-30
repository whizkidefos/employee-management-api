import Shift from '../../models/Shift.js';

export const checkIn = async (req, res) => {
  try {
    const { shiftId, location } = req.body;
    const shift = await Shift.findOne({
      _id: shiftId,
      assignedTo: req.user._id,
      status: 'assigned'
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found or not assigned to you' });
    }

    shift.status = 'in-progress';
    shift.checkedInAt = new Date();
    shift.currentLocation = {
      ...location,
      lastUpdated: new Date()
    };

    await shift.save();
    res.json({ message: 'Checked in successfully', shift });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { shiftId, location } = req.body;
    const shift = await Shift.findOne({
      _id: shiftId,
      assignedTo: req.user._id,
      status: 'in-progress'
    });

    if (!shift) {
      return res.status(404).json({ error: 'Active shift not found' });
    }

    shift.currentLocation = {
      ...location,
      lastUpdated: new Date()
    };

    await shift.save();
    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};