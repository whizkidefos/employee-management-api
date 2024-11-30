import Enrollment from '../../models/Enrollment.js';
import { generateCertificate } from '../../services/pdf.js';

export const updateProgress = async (req, res) => {
  try {
    const { enrollmentId, moduleId, progress } = req.body;
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      user: req.user._id
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    enrollment.progress = progress;
    
    if (moduleId) {
      enrollment.completedModules.push({
        moduleId,
        completedAt: new Date()
      });
    }

    // If course is completed, generate certificate
    if (progress === 100) {
      enrollment.status = 'completed';
      enrollment.completionDate = new Date();
      
      const certificateUrl = await generateCertificate({
        userName: `${req.user.firstName} ${req.user.lastName}`,
        courseName: enrollment.course.title,
        completionDate: enrollment.completionDate
      });
      
      enrollment.certificateUrl = certificateUrl;

      // Notify user
      await sendNotification(req.user._id, {
        type: 'COURSE_COMPLETED',
        message: 'Congratulations on completing the course!',
        data: { certificateUrl }
      });
    }

    await enrollment.save();
    res.json({ message: 'Progress updated successfully', enrollment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};