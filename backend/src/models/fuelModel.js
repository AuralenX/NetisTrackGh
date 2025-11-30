const Joi = require('joi');

const fuelLogSchema = Joi.object({
  siteId: Joi.string().required(),
  technicianId: Joi.string().required(),
  fuelAmount: Joi.number().min(0).required(),
  fuelCost: Joi.number().min(0).optional(),
  currentLevel: Joi.number().min(0).max(100).required(),
  previousLevel: Joi.number().min(0).max(100).optional(),
  refuelDate: Joi.date().default(Date.now),
  odometerReading: Joi.number().min(0).optional(),
  generatorHours: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
  images: Joi.array().items(Joi.string()).optional(), // URLs to fuel receipt images
  isVerified: Joi.boolean().default(false),
  verifiedBy: Joi.string().optional()
});

const fuelCalculationSchema = Joi.object({
  siteId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  calculationType: Joi.string().valid('daily', 'weekly', 'monthly').default('daily')
});

const validateFuelLog = (data) => {
  return fuelLogSchema.validate(data, { abortEarly: false });
};

const validateFuelCalculation = (data) => {
  return fuelCalculationSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateFuelLog,
  validateFuelCalculation,
  fuelLogSchema
};