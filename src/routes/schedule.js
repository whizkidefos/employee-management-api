import express from 'express';
import { auth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import {
  getShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  bookShift,
  cancelShift,
  getMyShifts,
  getShiftAvailability,
  getShiftsByDate,
  getShiftsByLocation
} from '../controllers/schedule/scheduleController.js';

const router = express.Router();

// Shift management routes
router.get('/', auth, getShifts);
router.post('/', auth, validate(schemas.shiftCreate), createShift);
router.get('/:id', auth, getShiftById);
router.put('/:id', auth, validate(schemas.shiftUpdate), updateShift);
router.delete('/:id', auth, deleteShift);

// Shift booking routes
router.post('/:id/book', auth, bookShift);
router.post('/:id/cancel', auth, cancelShift);

// User shifts
router.get('/my/shifts', auth, getMyShifts);

// Shift search routes
router.get('/availability/:date', auth, getShiftAvailability);
router.get('/date/:date', auth, getShiftsByDate);
router.get('/location/:location', auth, getShiftsByLocation);

export default router;
