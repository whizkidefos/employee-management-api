import express from 'express';
import { auth, admin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  withdrawFromCourse,
  getMyEnrollments,
  markCourseComplete,
  uploadCertificate,
  downloadCertificate,
  getTrainingHistory,
  getUpcomingTrainings
} from '../controllers/training/trainingController.js';
import { uploadDocument } from '../middleware/upload.js';

const router = express.Router();

// Course management routes (admin only)
router.get('/courses', auth, getCourses);
router.get('/courses/:id', auth, getCourseById);
router.post('/courses', auth, admin, validate(schemas.courseCreate), createCourse);
router.put('/courses/:id', auth, admin, validate(schemas.courseUpdate), updateCourse);
router.delete('/courses/:id', auth, admin, deleteCourse);

// Course enrollment routes
router.post('/courses/:id/enroll', auth, enrollInCourse);
router.post('/courses/:id/withdraw', auth, withdrawFromCourse);
router.get('/enrollments', auth, getMyEnrollments);
router.post('/courses/:id/complete', auth, markCourseComplete);

// Certificate routes
router.post('/courses/:id/certificate', auth, uploadDocument, uploadCertificate);
router.get('/courses/:id/certificate', auth, downloadCertificate);

// Training history and upcoming trainings
router.get('/history', auth, getTrainingHistory);
router.get('/upcoming', auth, getUpcomingTrainings);

export default router;
