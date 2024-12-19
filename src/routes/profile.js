import express from 'express';
import { auth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  uploadDocument,
  exportProfilePDF,
  addReference,
  updateWorkHistory,
  updateBankDetails
} from '../controllers/profile/profileController.js';

const router = express.Router();

// Get profile
router.get('/', auth, getProfile);

// Update profile
router.put('/', auth, validate(schemas.profileUpdate), updateProfile);

// Upload profile photo
router.post('/photo', auth, upload.single('photo'), uploadProfilePhoto);

// Upload documents
router.post('/documents', auth, upload.single('document'), uploadDocument);

// Export profile to PDF
router.get('/export', auth, exportProfilePDF);

// References
router.post('/references', auth, validate(schemas.reference), addReference);

// Work history
router.put('/work-history', auth, validate(schemas.workHistory), updateWorkHistory);

// Bank details
router.put('/bank-details', auth, validate(schemas.bankDetails), updateBankDetails);

export default router;
