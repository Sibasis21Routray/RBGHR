const Joi = require('joi');

const formValidationSchema = Joi.object({
  uploadedBy: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .empty('')
    .optional()
    .messages({
      'string.min': 'Uploaded by must be at least 2 characters',
      'string.max': 'Uploaded by cannot exceed 100 characters'
    }),

  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s]+$/)
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'First name must contain only letters and spaces'
    }),

  middleName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s]*$/)
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'Middle name must contain only letters and spaces'
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s]+$/)
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'Last name must contain only letters and spaces'
    }),

  contactNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'Contact number must be a valid 10-digit Indian mobile number'
    }),

  alternateContactNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .allow('')
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'Alternate contact number must be a valid 10-digit Indian mobile number'
    }),

  mailId: Joi.string()
    .email()
    .lowercase()
    .empty('')
    .optional()
    .messages({
      'string.email': 'Please enter a valid email address'
    }),

  alternateMailId: Joi.string()
    .email()
    .lowercase()
    .allow('')
    .empty('')
    .optional()
    .messages({
      'string.email': 'Please enter a valid alternate email address'
    }),

  fatherName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[A-Za-z\s]+$/)
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'Father name must contain only letters and spaces'
    }),

  panNo: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .uppercase()
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'PAN number must be in valid format (e.g., ABCDE1234F)'
    }),

  dateOfBirth: Joi.date()
    .max('now')
    .empty('')
    .optional()
    .messages({
      'date.base': 'Date of birth must be a valid date',
      'date.max': 'Date of birth cannot be in the future',
    }),

  gender: Joi.string()
    .valid('Male', 'Female', 'Other')
    .empty('')
    .optional()
    .messages({
    }),

  currentState: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .empty('')
    .optional()
    .messages({
    }),

  currentCity: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .empty('')
    .optional()
    .messages({
    }),

  preferredState: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .empty('')
    .optional()
    .messages({
    }),

  preferredCity: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .empty('')
    .optional()
    .messages({
    }),

  currentEmployer: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .empty('')
    .optional()
    .messages({
    }),

  designation: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .empty('')
    .optional()
    .messages({
    }),

  department: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .empty('')
    .optional()
    .messages({
    }),

  ctcInLakhs: Joi.number()
    .min(0)
    .allow('')
    .empty('')
    .optional()
    .messages({
      "number.base": "CTC must be a number",
      "number.min": "CTC cannot be negative",
    }),

  totalExperience: Joi.number()
    .integer()
    .min(0)
    .max(50)
    .optional()
    .messages({
      "number.base": "Total experience must be a number",
      "number.min": "Total experience cannot be negative",
      "number.max": "Total experience cannot exceed 50 years",
    }),

  // ✨ THIS IS THE CORRECTED RULE ✨
  // It now expects an array of objects, matching your database model.
  comments: Joi.array().items(
    Joi.object({
      text: Joi.string().trim().max(500).required(),
      addedBy: Joi.string().trim().allow(null, ''),
      addedAt: Joi.date()
    })
  ).optional().allow(null, ''),
});

const validateUser = (userData) => {
  return formValidationSchema.validate(userData, {
    abortEarly: false,
    stripUnknown: true // This is the option that was removing your comments
  });
};

module.exports = {
  validateUser,
  formValidationSchema
};
