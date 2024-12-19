import Course from '../../models/Course.js';
import Enrollment from '../../models/Enrollment.js';
import { createPaymentIntent, confirmPayment } from '../../services/payment.js';
import { generateCertificate } from '../../services/certificate.js';
import { getNotificationService } from '../../services/notification.js';
import logger from '../../utils/logger.js';

// Get all courses with filters
export const getCourses = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 });

    res.json(courses);
  } catch (error) {
    logger.error('Error getting courses:', error);
    res.status(400).json({ error: error.message });
  }
};

// Create a new course (admin only)
export const createCourse = async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      instructor: req.user._id
    });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    logger.error('Error creating course:', error);
    res.status(400).json({ error: error.message });
  }
};

// Enroll in a course
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { paymentMethodId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(course.price);

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user._id,
      course: courseId,
      paymentIntentId: paymentIntent.id,
      amount: course.price
    });
    await enrollment.save();

    // Send notification
    const notificationService = getNotificationService();
    await notificationService.sendNotification(req.user._id, {
      subject: 'Course Enrollment',
      message: `You have successfully enrolled in ${course.title}`,
      emailNotification: true
    });

    res.json({
      enrollment,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    logger.error('Error enrolling in course:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update course progress
export const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { moduleId, completed } = req.body;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      user: req.user._id
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Update module progress
    const moduleProgress = enrollment.progress.find(p => p.module.toString() === moduleId);
    if (moduleProgress) {
      moduleProgress.completed = completed;
      moduleProgress.completedAt = completed ? new Date() : null;
    } else {
      enrollment.progress.push({
        module: moduleId,
        completed,
        completedAt: completed ? new Date() : null
      });
    }

    // Check if course is completed
    const course = await Course.findById(enrollment.course);
    const allModulesCompleted = course.modules.every(module =>
      enrollment.progress.some(p => 
        p.module.toString() === module._id.toString() && p.completed
      )
    );

    if (allModulesCompleted && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      enrollment.status = 'completed';

      // Generate certificate
      const certificate = await generateCertificate({
        userName: `${req.user.firstName} ${req.user.lastName}`,
        courseName: course.title,
        completionDate: enrollment.completedAt
      });

      enrollment.certificateUrl = certificate.url;

      // Send notification
      const notificationService = getNotificationService();
      await notificationService.sendNotification(req.user._id, {
        subject: 'Course Completed',
        message: `Congratulations! You have completed ${course.title}`,
        emailNotification: true
      });
    }

    await enrollment.save();
    res.json(enrollment);
  } catch (error) {
    logger.error('Error updating course progress:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get user's enrolled courses
export const getEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('course')
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (error) {
    logger.error('Error getting enrolled courses:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get course details with progress
export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId)
      .populate('instructor', 'firstName lastName');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });

    res.json({
      course,
      enrollment
    });
  } catch (error) {
    logger.error('Error getting course details:', error);
    res.status(400).json({ error: error.message });
  }
};
