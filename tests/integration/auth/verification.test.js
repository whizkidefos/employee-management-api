import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../../../src/app.js';
import * as smsService from '../../../src/services/sms.js';
import User from '../../../src/models/User.js';

describe('Phone Verification API', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      phoneNumber: '+447700900000',
      // ... other required fields
    });
    await user.save();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/auth/verify/request', () => {
    it('should send verification code successfully', async () => {
      sinon.stub(smsService, 'sendVerificationCode').resolves('pending');

      const res = await request(app)
        .post('/api/auth/verify/request')
        .send({ phoneNumber: '+447700900000' });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', 'pending');
    });
  });

  describe('POST /api/auth/verify/confirm', () => {
    it('should verify code successfully', async () => {
      sinon.stub(smsService, 'verifyCode').resolves(true);

      const res = await request(app)
        .post('/api/auth/verify/confirm')
        .send({
          phoneNumber: '+447700900000',
          code: '123456'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Phone number verified successfully');

      const updatedUser = await User.findOne({ phoneNumber: '+447700900000' });
      expect(updatedUser.isVerified).to.be.true;
    });
  });
});