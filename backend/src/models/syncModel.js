const Joi = require('joi');

const syncQueueSchema = Joi.object({
  userId: Joi.string().required(),
  deviceId: Joi.string().required(),
  operations: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('create', 'update', 'delete').required(),
      collection: Joi.string().required(),
      documentId: Joi.string().required(),
      data: Joi.object().optional(),
      timestamp: Joi.date().required(),
      offlineId: Joi.string().optional() // ID generated offline
    })
  ).required(),
  lastSyncTimestamp: Joi.date().required(),
  appVersion: Joi.string().optional(),
  deviceInfo: Joi.object().optional()
});

const syncConflictSchema = Joi.object({
  operationId: Joi.string().required(),
  localData: Joi.object().required(),
  serverData: Joi.object().required(),
  resolvedData: Joi.object().optional(),
  resolution: Joi.string().valid('local', 'server', 'manual').optional(),
  resolvedBy: Joi.string().optional(),
  resolvedAt: Joi.date().optional()
});

const validateSyncQueue = (data) => {
  return syncQueueSchema.validate(data, { abortEarly: false });
};

const validateSyncConflict = (data) => {
  return syncConflictSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateSyncQueue,
  validateSyncConflict,
  syncQueueSchema
};