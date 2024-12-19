import express from 'express';
import { auth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { uploadDocument } from '../middleware/upload.js';
import {
  uploadUserDocument,
  getUserDocuments,
  getDocumentById,
  deleteDocument,
  updateDocumentStatus,
  downloadDocument,
  getDocumentTypes,
  getRequiredDocuments,
  getDocumentStatus
} from '../controllers/document/documentController.js';

const router = express.Router();

// Document management routes
router.post('/upload', auth, uploadDocument, uploadUserDocument);
router.get('/', auth, getUserDocuments);
router.get('/types', auth, getDocumentTypes);
router.get('/required', auth, getRequiredDocuments);
router.get('/status', auth, getDocumentStatus);
router.get('/:id', auth, getDocumentById);
router.get('/:id/download', auth, downloadDocument);
router.delete('/:id', auth, deleteDocument);
router.put('/:id/status', auth, validate(schemas.documentStatus), updateDocumentStatus);

export default router;
