import Document from '../../models/Document.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';
import notificationService from '../../services/notification.js';
import { uploadToS3, getSignedUrl, deleteFromS3 } from '../../services/storage.js';

// Document types and their validation periods
const DOCUMENT_TYPES = {
  'Enhanced DBS': { required: true, validityMonths: 36 },
  'Right to Work': { required: true, validityMonths: null },
  'Professional Registration': { required: true, validityMonths: 12 },
  'Training Certificate': { required: false, validityMonths: 12 },
  'ID Document': { required: true, validityMonths: null },
  'Proof of Address': { required: true, validityMonths: 3 },
  'Reference': { required: true, validityMonths: 12 },
  'Immunization Record': { required: true, validityMonths: 12 },
  'Insurance Certificate': { required: true, validityMonths: 12 }
};

// Upload user document
export const uploadUserDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const { type, description, expiryDate } = req.body;

    if (!DOCUMENT_TYPES[type]) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Upload document to storage
    const documentUrl = await uploadToS3(req.file, 'documents');

    // Create document record
    const document = new Document({
      user: req.user.id,
      type,
      description,
      url: documentUrl,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      expiryDate: expiryDate || null,
      status: 'pending'
    });

    await document.save();

    // Send notification
    await notificationService.sendNotification(req.user.id, {
      type: 'DOCUMENT_UPLOADED',
      subject: 'Document Uploaded Successfully',
      message: `Your ${type} document has been uploaded and is pending review.`
    });

    res.status(201).json(document);
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ error: 'Error uploading document' });
  }
};

// Get user's documents
export const getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    logger.error('Error getting documents:', error);
    res.status(500).json({ error: 'Error retrieving documents' });
  }
};

// Get document by ID
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    logger.error('Error getting document:', error);
    res.status(500).json({ error: 'Error retrieving document' });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from storage
    await deleteFromS3(document.url);

    // Delete document record
    await document.remove();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
};

// Update document status
export const updateDocumentStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.status = status;
    document.reviewComment = comment;
    document.reviewedAt = new Date();
    document.reviewedBy = req.user.id;
    await document.save();

    // Send notification to document owner
    await notificationService.sendNotification(document.user, {
      type: 'DOCUMENT_STATUS_UPDATED',
      subject: 'Document Status Updated',
      message: `Your ${document.type} document has been ${status}. ${comment ? `Comment: ${comment}` : ''}`
    });

    res.json(document);
  } catch (error) {
    logger.error('Error updating document status:', error);
    res.status(500).json({ error: 'Error updating document status' });
  }
};

// Download document
export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get signed URL for document download
    const downloadUrl = await getSignedUrl(document.url);
    res.json({ downloadUrl });
  } catch (error) {
    logger.error('Error downloading document:', error);
    res.status(500).json({ error: 'Error downloading document' });
  }
};

// Get document types
export const getDocumentTypes = async (req, res) => {
  try {
    res.json(DOCUMENT_TYPES);
  } catch (error) {
    logger.error('Error getting document types:', error);
    res.status(500).json({ error: 'Error retrieving document types' });
  }
};

// Get required documents
export const getRequiredDocuments = async (req, res) => {
  try {
    const requiredDocs = Object.entries(DOCUMENT_TYPES)
      .filter(([_, config]) => config.required)
      .map(([type, config]) => ({
        type,
        validityMonths: config.validityMonths
      }));

    res.json(requiredDocs);
  } catch (error) {
    logger.error('Error getting required documents:', error);
    res.status(500).json({ error: 'Error retrieving required documents' });
  }
};

// Get document status
export const getDocumentStatus = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id });
    const status = {};

    // Check status for each document type
    for (const [type, config] of Object.entries(DOCUMENT_TYPES)) {
      const doc = documents.find(d => d.type === type);

      status[type] = {
        required: config.required,
        validityMonths: config.validityMonths,
        status: doc ? doc.status : 'missing',
        expiryDate: doc ? doc.expiryDate : null,
        lastUpdated: doc ? doc.updatedAt : null
      };

      // Check if document is expired
      if (doc && doc.expiryDate && new Date(doc.expiryDate) < new Date()) {
        status[type].status = 'expired';
      }
    }

    res.json(status);
  } catch (error) {
    logger.error('Error getting document status:', error);
    res.status(500).json({ error: 'Error retrieving document status' });
  }
};
