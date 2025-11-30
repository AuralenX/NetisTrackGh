const Joi = require('joi');

const maintenanceLogSchema = Joi.object({
  siteId: Joi.string().required(),
  technicianId: Joi.string().required(),
  maintenanceType: Joi.string().valid('routine', 'corrective', 'preventive', 'emergency').required(),
  title: Joi.string().max(100).required(),
  description: Joi.string().max(1000).required(),
  partsUsed: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      cost: Joi.number().min(0).optional(),
      partNumber: Joi.string().optional()
    })
  ).default([]),
  laborHours: Joi.number().min(0).required(),
  totalCost: Joi.number().min(0).optional(),
  completedDate: Joi.date().default(Date.now),
  nextMaintenanceDate: Joi.date().optional(),
  status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled').default('completed'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  images: Joi.array().items(Joi.string()).optional(),
  generatorHours: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
  isVerified: Joi.boolean().default(false),
  verifiedBy: Joi.string().optional()
});

const maintenanceScheduleSchema = Joi.object({
  siteId: Joi.string().required(),
  maintenanceType: Joi.string().valid('routine', 'preventive').required(),
  title: Joi.string().max(100).required(),
  description: Joi.string().max(500).required(),
  scheduledDate: Joi.date().required(),
  estimatedHours: Joi.number().min(0).required(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  assignedTo: Joi.string().optional(),
  recurrence: Joi.string().valid('once', 'weekly', 'monthly', 'quarterly', 'yearly').default('once')
});

const validateMaintenanceLog = (data) => {
  return maintenanceLogSchema.validate(data, { abortEarly: false });
};

const validateMaintenanceSchedule = (data) => {
  return maintenanceScheduleSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateMaintenanceLog,
  validateMaintenanceSchedule,
  maintenanceLogSchema
};