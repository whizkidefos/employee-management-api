import Course from '../../models/Course.js';
import { validateCourse } from '../../utils/validation.js';

export const createCourse = async (req, res) => {
  try {
    const { error } = validateCourse(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const course = new Course({
      ...req.body,
      instructor: req.user._id
    });

    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};