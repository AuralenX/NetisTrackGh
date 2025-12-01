const Joi = require('joi');

// Password reset request schema
const passwordResetSchema = Joi.object({
  email: Joi.string().email().required()
});

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required()
});

// Refresh token schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

// Security log schema
const securityLogSchema = Joi.object({
  event: Joi.string().required(),
  userId: Joi.string().optional(),
  email: Joi.string().email().optional(),
  ip: Joi.string().optional(),
  userAgent: Joi.string().optional(),
  details: Joi.object().optional()
});

// Logout schema
const logoutSchema = Joi.object({
  deviceId: Joi.string().optional(),
  reason: Joi.string().optional()
});

const validatePasswordReset = (data) => {
  return passwordResetSchema.validate(data, { abortEarly: false });
};

const validateChangePassword = (data) => {
  return changePasswordSchema.validate(data, { abortEarly: false });
};

const validateRefreshToken = (data) => {
  return refreshTokenSchema.validate(data, { abortEarly: false });
};

const validateSecurityLog = (data) => {
  return securityLogSchema.validate(data, { abortEarly: false });
};

const validateLogout = (data) => {
  return logoutSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validatePasswordReset,
  validateChangePassword,
  validateRefreshToken,
  validateSecurityLog,
  validateLogout,
  passwordResetSchema,
  changePasswordSchema,
  refreshTokenSchema
};