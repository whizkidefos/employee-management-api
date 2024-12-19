import User from '../../models/User.js';
import { uploadToS3 } from '../../services/storage.js';
import { generateProfilePDF } from '../../services/pdf.js';
import { geocodeAddress } from '../../services/maps.js';
import logger from '../../utils/logger.js';

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('trainings.course');
    res.json(user);
  } catch (error) {
    logger.error('Error getting profile:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    // Handle address update with Google Maps geocoding
    if (updates.address) {
      const geocoded = await geocodeAddress(
        `${updates.address.street}, ${updates.address.postcode}`
      );
      updates.address = {
        ...updates.address,
        coordinates: {
          lat: geocoded.lat,
          lng: geocoded.lng
        }
      };
    }

    // Update user fields
    Object.keys(updates).forEach(key => {
      if (key !== 'password' && key !== 'email') {
        user[key] = updates[key];
      }
    });

    await user.save();
    res.json(user);
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(400).json({ error: error.message });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = await uploadToS3(req.file, 'profile-photos');
    
    const user = await User.findById(req.user._id);
    user.profilePhoto = photoUrl;
    await user.save();

    res.json({ photoUrl });
  } catch (error) {
    logger.error('Error uploading profile photo:', error);
    res.status(400).json({ error: error.message });
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType } = req.body;
    const documentUrl = await uploadToS3(req.file, 'documents');
    
    const user = await User.findById(req.user._id);

    switch (documentType) {
      case 'dbs':
        user.enhancedDBS.document = documentUrl;
        break;
      case 'brp':
        user.brpDocument = documentUrl;
        break;
      case 'cv':
        user.cvDocument = documentUrl;
        break;
      case 'certificate':
        user.combinedCertificate = documentUrl;
        break;
      default:
        throw new Error('Invalid document type');
    }

    await user.save();
    res.json({ documentUrl });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(400).json({ error: error.message });
  }
};

// Export profile to PDF
export const exportProfilePDF = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('trainings.course');

    const pdfBuffer = await generateProfilePDF(user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=profile-${user._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting profile to PDF:', error);
    res.status(400).json({ error: error.message });
  }
};

// Add reference
export const addReference = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.references.push(req.body);
    await user.save();
    res.json(user.references);
  } catch (error) {
    logger.error('Error adding reference:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update work history
export const updateWorkHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.workHistory = req.body.workHistory;
    await user.save();
    res.json({ workHistory: user.workHistory });
  } catch (error) {
    logger.error('Error updating work history:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update bank details
export const updateBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.bankDetails = req.body;
    await user.save();
    res.json({ message: 'Bank details updated successfully' });
  } catch (error) {
    logger.error('Error updating bank details:', error);
    res.status(400).json({ error: error.message });
  }
};
