import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ errors });
    }
    next();
  };
};

// Validation schemas
export const schemas = {
  userRegistration: Joi.object({
    firstName: Joi.string().required().trim(),
    lastName: Joi.string().required().trim(),
    email: Joi.string().email().required().trim(),
    phoneNumber: Joi.string().required().trim(),
    username: Joi.string().required().trim(),
    jobRole: Joi.string().valid('Registered Nurse', 'Healthcare Assistant', 'Support Worker').required(),
    password: Joi.string().min(8).required(),
    profilePhoto: Joi.string(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('male', 'female').required(),
    address: Joi.object({
      postcode: Joi.string().required(),
      street: Joi.string().required(),
      country: Joi.string().required()
    }).required(),
    hasUnspentConvictions: Joi.boolean().required(),
    nationalInsuranceNumber: Joi.string().required(),
    enhancedDBS: Joi.object({
      has: Joi.boolean().required(),
      document: Joi.string().when('has', {
        is: true,
        then: Joi.required()
      })
    }).required(),
    nationality: Joi.string().valid('UK', 'EU', 'Other').required(),
    rightToWork: Joi.boolean().required(),
    brpNumber: Joi.string().when('nationality', {
      is: 'Other',
      then: Joi.required()
    }),
    brpDocument: Joi.string().when('nationality', {
      is: 'Other',
      then: Joi.required()
    }),
    references: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required()
      })
    ),
    workHistory: Joi.string(),
    consent: Joi.boolean().valid(true).required(),
    cvDocument: Joi.string(),
    trainings: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        passed: Joi.boolean(),
        datePassed: Joi.date()
      })
    ),
    otherTrainings: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        datePassed: Joi.date().required()
      })
    ),
    combinedCertificate: Joi.string(),
    bankDetails: Joi.object({
      sortCode: Joi.string().required(),
      accountNumber: Joi.string().required(),
      bankName: Joi.string().required()
    }).required(),
    signature: Joi.object({
      content: Joi.string().required(),
      date: Joi.date().required()
    }).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  verifyPhone: Joi.object({
    userId: Joi.string().required(),
    code: Joi.string().required()
  }),

  requestPasswordReset: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  shiftCreation: Joi.object({
    startTime: Joi.date().required(),
    endTime: Joi.date().greater(Joi.ref('startTime')).required(),
    location: Joi.object({
      name: Joi.string().required(),
      address: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      }).required()
    }).required(),
    role: Joi.string()
      .valid('Registered Nurse', 'Healthcare Assistant', 'Support Worker')
      .required(),
    payRate: Joi.number().positive().required(),
    notes: Joi.string()
  }),

  shiftAssignment: Joi.object({
    userId: Joi.string().required()
  }),

  locationUpdate: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  })
};
