import express from 'express';
import { auth, adminAuth } from '../middleware/auth.js';
import { createCourse } from '../controllers/courses/create.js';
import { enrollInCourse } from '../controllers/courses/enroll.js';
import { updateProgress } from '../controllers/courses/progress.js';

const router = express.Router();

router.post('/create', adminAuth, createCourse);
router.post('/enroll', auth, enrollInCourse);
router.post('/progress', auth, updateProgress);

export default router;