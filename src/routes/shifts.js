import express from 'express';
import { auth, adminAuth } from '../middleware/auth.js';
import { createShift } from '../controllers/shifts/create.js';
import { assignShift } from '../controllers/shifts/assign.js';
import { checkIn, updateLocation } from '../controllers/shifts/tracking.js';
import { exportShiftReport } from '../controllers/shifts/export.js';

const router = express.Router();

router.post('/create', adminAuth, createShift);
router.post('/assign', adminAuth, assignShift);
router.post('/check-in', auth, checkIn);
router.post('/location', auth, updateLocation);
router.get('/export', adminAuth, exportShiftReport);

export default router;