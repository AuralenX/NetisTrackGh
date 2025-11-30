const Joi = require('joi');

const siteSchema = Joi.object({
  siteId: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
    'string.pattern.base': 'Site ID must be a 6-digit number',
    'any.required': 'Site ID is required'
  }),
  name: Joi.string().min(1).max(100).required(),
  location: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).optional()
  }).required(),
  
  // AC System Details
  acSystem: Joi.object({
    capacity: Joi.number().min(0).required(),
    voltage: Joi.string().valid('110V', '220V', '240V').required(),
    phase: Joi.string().valid('Single', 'Three').required()
  }).required(),
  
  // DC System Details
  dcSystem: Joi.object({
    batteryCapacity: Joi.number().min(0).required(),
    solarCapacity: Joi.number().min(0).optional(),
    inverterCapacity: Joi.number().min(0).required()
  }).required(),
  
  // Generator Info
  generator: Joi.object({
    capacity: Joi.number().min(0).required(),
    fuelTankCapacity: Joi.number().min(0).required(),
    currentRunHours: Joi.number().min(0).default(0),
    lastMaintenanceHours: Joi.number().min(0).default(0)
  }).required(),
  
  // Fuel Information
  fuel: Joi.object({
    currentLevel: Joi.number().min(0).max(100).required(),
    consumptionRate: Joi.number().min(0).required(), // liters per hour
    lastRefuelDate: Joi.date().optional()
  }).required(),
  
  // Maintenance Schedule
  maintenanceSchedule: Joi.object({
    nextMaintenance: Joi.date().required(),
    maintenanceInterval: Joi.number().min(0).required(), // hours
    lastMaintenance: Joi.date().optional()
  }).required(),
  
  assignedTechnician: Joi.string().optional(), // Firebase UID
  isActive: Joi.boolean().default(true),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now)
});

const siteUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  location: Joi.object({
    address: Joi.string().optional(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional()
  }).optional(),
  acSystem: Joi.object({
    capacity: Joi.number().min(0).optional(),
    voltage: Joi.string().valid('110V', '220V', '240V').optional(),
    phase: Joi.string().valid('Single', 'Three').optional()
  }).optional(),
  dcSystem: Joi.object({
    batteryCapacity: Joi.number().min(0).optional(),
    solarCapacity: Joi.number().min(0).optional(),
    inverterCapacity: Joi.number().min(0).optional()
  }).optional(),
  generator: Joi.object({
    capacity: Joi.number().min(0).optional(),
    fuelTankCapacity: Joi.number().min(0).optional(),
    currentRunHours: Joi.number().min(0).optional(),
    lastMaintenanceHours: Joi.number().min(0).optional()
  }).optional(),
  fuel: Joi.object({
    currentLevel: Joi.number().min(0).max(100).optional(),
    consumptionRate: Joi.number().min(0).optional(),
    lastRefuelDate: Joi.date().optional()
  }).optional(),
  maintenanceSchedule: Joi.object({
    nextMaintenance: Joi.date().optional(),
    maintenanceInterval: Joi.number().min(0).optional(),
    lastMaintenance: Joi.date().optional()
  }).optional(),
  assignedTechnician: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

const validateSite = (data) => {
  return siteSchema.validate(data, { abortEarly: false });
};

const validateSiteUpdate = (data) => {
  return siteUpdateSchema.validate(data, { abortEarly: false });
};

module.exports = { 
  validateSite, 
  validateSiteUpdate, 
  siteSchema 
};