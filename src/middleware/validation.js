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
  }),

  courseCreation: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().valid('COSHH', 'Conflict Resolution', 'Domestic Violence', 'Epilepsy Awareness', 'Other').required(),
    price: Joi.number().min(0).required(),
    duration: Joi.number().min(1).required(),
    modules: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        duration: Joi.number(),
        content: Joi.string(),
        order: Joi.number().required()
      })
    ).required(),
    thumbnail: Joi.string()
  }),

  courseEnrollment: Joi.object({
    paymentMethodId: Joi.string().required()
  }),

  progressUpdate: Joi.object({
    moduleId: Joi.string().required(),
    completed: Joi.boolean().required()
  }),

  profileUpdate: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string(),
    jobRole: Joi.string().valid('Registered Nurse', 'Healthcare Assistant', 'Support Worker'),
    dateOfBirth: Joi.date(),
    gender: Joi.string().valid('male', 'female'),
    address: Joi.object({
      postcode: Joi.string(),
      street: Joi.string(),
      country: Joi.string()
    }),
    hasUnspentConvictions: Joi.boolean(),
    nationality: Joi.string().valid('UK', 'EU', 'Other'),
    rightToWork: Joi.boolean(),
    brpNumber: Joi.string(),
    workHistory: Joi.string()
  }),

  reference: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required()
  }),

  workHistory: Joi.object({
    workHistory: Joi.string().required()
  }),

  bankDetails: Joi.object({
    sortCode: Joi.string().required(),
    accountNumber: Joi.string().required(),
    bankName: Joi.string().required()
  })
};
