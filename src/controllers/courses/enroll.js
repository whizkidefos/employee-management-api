import Course from '../../models/Course.js';
import Enrollment from '../../models/Enrollment.js';
import { createPaymentIntent, confirmPayment } from '../../services/payment.js';
import { sendNotification } from '../../services/notification.js';

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
      status: { $ne: 'cancelled' }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(course.price);

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user._id,
      course: courseId,
      paymentId: paymentIntent.id,
      startDate: new Date()
    });

    await enrollment.save();

    res.json({
      message: 'Enrollment initiated',
      clientSecret: paymentIntent.client_secret,
      enrollment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};