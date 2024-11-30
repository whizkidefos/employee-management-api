import Shift from '../../models/Shift.js';
import { validateShift } from '../../utils/validation.js';

export const createShift = async (req, res) => {
  try {
    const { error } = validateShift(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const shift = new Shift({
      ...req.body,
      createdBy: req.user._id
    });

    await shift.save();
    res.status(201).json({ message: 'Shift created successfully', shift });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};