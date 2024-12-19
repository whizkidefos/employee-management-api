import express from 'express';
import { auth, adminAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import {
  createShift,
  getShifts,
  assignShift,
  checkIn,
  updateLocation,
  checkOut,
  exportShiftsPDF
} from '../controllers/shifts/shiftController.js';

const router = express.Router();

// Admin routes
router.post('/', adminAuth, validate(schemas.shiftCreation), createShift);
router.post('/:shiftId/assign', adminAuth, validate(schemas.shiftAssignment), assignShift);
router.get('/export', adminAuth, exportShiftsPDF);

// User routes
router.get('/', auth, getShifts);
router.post('/:shiftId/check-in', auth, validate(schemas.locationUpdate), checkIn);
router.post('/:shiftId/location', auth, validate(schemas.locationUpdate), updateLocation);
router.post('/:shiftId/check-out', auth, validate(schemas.locationUpdate), checkOut);

export default router;