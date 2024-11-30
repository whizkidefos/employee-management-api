import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../../src/app.js';
import Course from '../../models/Course.js';
import Enrollment from '../../models/Enrollment.js';
import { createPaymentIntent } from '../../services/payment.js';

describe('Course Management API', () => {
  let adminToken, userToken, courseId;

  before(async () => {
    // Setup test tokens and test course
  });

  describe('POST /api/courses/create', () => {
    it('should create a new course when admin authenticated', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        category: 'COSHH',
        price: 99.99,
        duration: 120,
        modules: [{
          title: 'Module 1',
          description: 'Test Module',
          duration: 60,
          order: 1
        }]
      };

      const res = await request(app)
        .post('/api/courses/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData);

      expect(res.status).to.equal(201);
      expect(res.body.course).to.have.property('title', courseData.title);
      courseId = res.body.course._id;
    });
  });

  describe('POST /api/courses/enroll', () => {
    it('should create enrollment and payment intent', async () => {
      const paymentIntentStub = sinon.stub(createPaymentIntent).resolves({
        id: 'test_intent_id',
        client_secret: 'test_secret'
      });

      const res = await request(app)
        .post('/api/courses/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('clientSecret');
      expect(res.body.enrollment).to.have.property('status', 'pending');

      paymentIntentStub.restore();
    });
  });

  describe('POST /api/courses/progress', () => {
    it('should update course progress and generate certificate when completed', async () => {
      const enrollmentId = 'test_enrollment_id';
      const progressData = {
        enrollmentId,
        progress: 100,
        moduleId: 'test_module_id'
      };

      const res = await request(app)
        .post('/api/courses/progress')
        .set('Authorization', `Bearer ${userToken}`)
        .send(progressData);

      expect(res.status).to.equal(200);
      expect(res.body.enrollment).to.have.property('status', 'completed');
      expect(res.body.enrollment).to.have.property('certificateUrl');
    });
  });
});