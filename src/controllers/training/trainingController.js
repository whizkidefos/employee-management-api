import Course from '../../models/Course.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';
import notificationService from '../../services/notification.js';
import { uploadToS3, getSignedUrl } from '../../services/storage.js';

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'firstName lastName')
      .sort({ startDate: 1 });
    res.json(courses);
  } catch (error) {
    logger.error('Error getting courses:', error);
    res.status(500).json({ error: 'Error retrieving courses' });
  }
};

// Get course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName')
      .populate('enrolledUsers', 'firstName lastName');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    logger.error('Error getting course:', error);
    res.status(500).json({ error: 'Error retrieving course' });
  }
};

// Create course (admin only)
export const createCourse = async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      instructor: req.user.id
    });
    await course.save();

    // Notify relevant users about new course
    const users = await User.find({ jobRole: course.requiredRole });
    for (const user of users) {
      await notificationService.sendNotification(user.id, {
        type: 'NEW_COURSE',
        subject: 'New Training Course Available',
        message: `A new training course "${course.title}" is now available`,
        data: { courseId: course.id }
      });
    }

    res.status(201).json(course);
  } catch (error) {
    logger.error('Error creating course:', error);
    res.status(500).json({ error: 'Error creating course' });
  }
};

// Update course (admin only)
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Notify enrolled users about course update
    for (const userId of course.enrolledUsers) {
      await notificationService.sendNotification(userId, {
        type: 'COURSE_UPDATED',
        subject: 'Course Updated',
        message: `The course "${course.title}" has been updated`,
        data: { courseId: course.id }
      });
    }

    res.json(course);
  } catch (error) {
    logger.error('Error updating course:', error);
    res.status(500).json({ error: 'Error updating course' });
  }
};

// Delete course (admin only)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Notify enrolled users about course cancellation
    for (const userId of course.enrolledUsers) {
      await notificationService.sendNotification(userId, {
        type: 'COURSE_CANCELLED',
        subject: 'Course Cancelled',
        message: `The course "${course.title}" has been cancelled`,
        data: { courseId: course.id }
      });
    }

    await course.remove();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    logger.error('Error deleting course:', error);
    res.status(500).json({ error: 'Error deleting course' });
  }
};

// Enroll in course
export const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.enrolledUsers.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    if (user.jobRole !== course.requiredRole) {
      return res.status(400).json({ error: 'You are not eligible for this course' });
    }

    course.enrolledUsers.push(req.user.id);
    await course.save();

    // Add course to user's trainings
    user.trainings.push({
      course: course.id,
      enrolledAt: new Date(),
      status: 'enrolled'
    });
    await user.save();

    // Send confirmation notification
    await notificationService.sendNotification(req.user.id, {
      type: 'COURSE_ENROLLED',
      subject: 'Course Enrollment Successful',
      message: `You have successfully enrolled in "${course.title}"`,
      data: { courseId: course.id }
    });

    res.json({ message: 'Successfully enrolled in course', course });
  } catch (error) {
    logger.error('Error enrolling in course:', error);
    res.status(500).json({ error: 'Error enrolling in course' });
  }
};

// Withdraw from course
export const withdrawFromCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!course.enrolledUsers.includes(req.user.id)) {
      return res.status(400).json({ error: 'Not enrolled in this course' });
    }

    course.enrolledUsers = course.enrolledUsers.filter(id => id.toString() !== req.user.id);
    await course.save();

    // Update user's training status
    const trainingIndex = user.trainings.findIndex(t => t.course.toString() === course.id);
    if (trainingIndex !== -1) {
      user.trainings[trainingIndex].status = 'withdrawn';
      user.trainings[trainingIndex].withdrawnAt = new Date();
      await user.save();
    }

    res.json({ message: 'Successfully withdrawn from course' });
  } catch (error) {
    logger.error('Error withdrawing from course:', error);
    res.status(500).json({ error: 'Error withdrawing from course' });
  }
};

// Get user's enrollments
export const getMyEnrollments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'trainings.course',
        select: 'title description startDate endDate location'
      });

    res.json(user.trainings);
  } catch (error) {
    logger.error('Error getting enrollments:', error);
    res.status(500).json({ error: 'Error retrieving enrollments' });
  }
};

// Mark course as complete
export const markCourseComplete = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const training = user.trainings.find(t => t.course.toString() === course.id);
    if (!training) {
      return res.status(400).json({ error: 'Not enrolled in this course' });
    }

    training.status = 'completed';
    training.completedAt = new Date();
    await user.save();

    res.json({ message: 'Course marked as complete', training });
  } catch (error) {
    logger.error('Error marking course complete:', error);
    res.status(500).json({ error: 'Error updating course status' });
  }
};

// Upload course certificate
export const uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No certificate file provided' });
    }

    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const training = user.trainings.find(t => t.course.toString() === course.id);
    if (!training) {
      return res.status(400).json({ error: 'Not enrolled in this course' });
    }

    // Upload certificate to storage
    const certificateUrl = await uploadToS3(req.file, 'certificates');

    // Update training record
    training.certificateUrl = certificateUrl;
    training.certificateUploadedAt = new Date();
    await user.save();

    res.json({ message: 'Certificate uploaded successfully', certificateUrl });
  } catch (error) {
    logger.error('Error uploading certificate:', error);
    res.status(500).json({ error: 'Error uploading certificate' });
  }
};

// Download course certificate
export const downloadCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const training = user.trainings.find(t => t.course.toString() === course.id);
    if (!training || !training.certificateUrl) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Get signed URL for certificate download
    const downloadUrl = await getSignedUrl(training.certificateUrl);
    res.json({ downloadUrl });
  } catch (error) {
    logger.error('Error downloading certificate:', error);
    res.status(500).json({ error: 'Error downloading certificate' });
  }
};

// Get training history
export const getTrainingHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'trainings.course',
        select: 'title description'
      });

    const completedTrainings = user.trainings.filter(t => t.status === 'completed');
    res.json(completedTrainings);
  } catch (error) {
    logger.error('Error getting training history:', error);
    res.status(500).json({ error: 'Error retrieving training history' });
  }
};

// Get upcoming trainings
export const getUpcomingTrainings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const enrolledCourseIds = user.trainings
      .filter(t => t.status === 'enrolled')
      .map(t => t.course);

    const upcomingCourses = await Course.find({
      _id: { $in: enrolledCourseIds },
      startDate: { $gt: new Date() }
    }).sort({ startDate: 1 });

    res.json(upcomingCourses);
  } catch (error) {
    logger.error('Error getting upcoming trainings:', error);
    res.status(500).json({ error: 'Error retrieving upcoming trainings' });
  }
};
