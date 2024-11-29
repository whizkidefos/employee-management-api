import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import User from '../src/models/User.js';
import mongoose from 'mongoose';

describe('User API Tests', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+447700900000',
        username: 'johndoe',
        jobRole: 'Registered Nurse',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        address: {
          postcode: 'SW1A 1AA',
          street: '10 Downing Street',
          country: 'United Kingdom'
        },
        hasUnspentConvictions: false,
        nationalInsuranceNumber: 'AB123456C',
        enhancedDBS: {
          has: true,
          document: 'dbs-doc-url'
        },
        nationality: 'UK',
        rightToWork: true,
        consent: true,
        bankDetails: {
          sortCode: '123456',
          accountNumber: '12345678',
          bankName: 'Test Bank'
        },
        signature: {
          content: 'base64-signature',
          date: new Date()
        }
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('message', 'User registered successfully');
      expect(res.body.user).to.have.property('email', userData.email);
      expect(res.body.user).to.not.have.property('password');
    });

    it('should return validation errors for missing required fields', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({});

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });
  });
});