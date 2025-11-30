const Joi = require('joi');

const userSchema = Joi.object({
  uid: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('technician', 'supervisor', 'admin').required(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  phoneNumber: Joi.string().max(20).optional(),
  assignedSites: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now)
});

const userUpdateSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  phoneNumber: Joi.string().max(20).optional(),
  assignedSites: Joi.array().items(Joi.string()).optional()
});

const validateUser = (data) => {
  return userSchema.validate(data, { abortEarly: false });
};

const validateUserUpdate = (data) => {
  return userUpdateSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateUser,
  validateUserUpdate,
  userSchema
};