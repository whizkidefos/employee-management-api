import express from 'express';
import { auth, adminAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import {
  getCourses,
  createCourse,
  enrollInCourse,
  updateProgress,
  getEnrolledCourses,
  getCourseDetails
} from '../controllers/courses/courseController.js';

const router = express.Router();

// Public routes
router.get('/', getCourses);

// Protected routes
router.get('/enrolled', auth, getEnrolledCourses);
router.get('/:courseId', auth, getCourseDetails);
router.post('/:courseId/enroll', auth, validate(schemas.courseEnrollment), enrollInCourse);
router.post('/enrollments/:enrollmentId/progress', auth, validate(schemas.progressUpdate), updateProgress);

// Admin routes
router.post('/', adminAuth, validate(schemas.courseCreation), createCourse);

export default router;