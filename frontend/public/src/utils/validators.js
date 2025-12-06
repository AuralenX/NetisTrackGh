/**
 * NetisTrackGh Frontend Validators
 * Aligns with backend Joi schemas for data validation
 * Reference: backend/src/models/
 */

export const validators = {
    
    // ============================
    // FUEL LOG VALIDATORS
    // ============================
    validateFuelLog(data) {
        const errors = [];

        // Required fields
        if (!data.siteId) {
            errors.push('Site ID is required');
        } else if (!/^[0-9]{6}$/.test(data.siteId)) {
            errors.push('Site ID must be a 6-digit number');
        }

        if (!data.technicianId) {
            errors.push('Technician ID is required');
        }

        if (data.fuelAmount === undefined || data.fuelAmount === '') {
            errors.push('Fuel amount is required');
        } else if (isNaN(data.fuelAmount) || data.fuelAmount < 0) {
            errors.push('Fuel amount must be a positive number');
        }

        if (data.currentLevel === undefined || data.currentLevel === '') {
            errors.push('Current fuel level is required');
        } else if (isNaN(data.currentLevel) || data.currentLevel < 0 || data.currentLevel > 100) {
            errors.push('Current fuel level must be between 0 and 100');
        }

        // Optional but validated if provided
        if (data.previousLevel !== undefined && data.previousLevel !== '') {
            if (isNaN(data.previousLevel) || data.previousLevel < 0 || data.previousLevel > 100) {
                errors.push('Previous fuel level must be between 0 and 100');
            }
        }

        if (data.fuelCost !== undefined && data.fuelCost !== '') {
            if (isNaN(data.fuelCost) || data.fuelCost < 0) {
                errors.push('Fuel cost must be a positive number');
            }
        }

        if (data.odometerReading !== undefined && data.odometerReading !== '') {
            if (isNaN(data.odometerReading) || data.odometerReading < 0) {
                errors.push('Odometer reading must be a positive number');
            }
        }

        if (data.generatorHours !== undefined && data.generatorHours !== '') {
            if (isNaN(data.generatorHours) || data.generatorHours < 0) {
                errors.push('Generator hours must be a positive number');
            }
        }

        if (data.notes && data.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            data: errors.length === 0 ? this.sanitizeFuelLog(data) : null
        };
    },

    sanitizeFuelLog(data) {
        return {
            siteId: data.siteId,
            technicianId: data.technicianId,
            fuelAmount: parseFloat(data.fuelAmount),
            currentLevel: parseFloat(data.currentLevel),
            refuelDate: data.refuelDate || new Date().toISOString(),
            ...(data.previousLevel !== undefined && data.previousLevel !== '' && { previousLevel: parseFloat(data.previousLevel) }),
            ...(data.fuelCost !== undefined && data.fuelCost !== '' && { fuelCost: parseFloat(data.fuelCost) }),
            ...(data.odometerReading !== undefined && data.odometerReading !== '' && { odometerReading: parseFloat(data.odometerReading) }),
            ...(data.generatorHours !== undefined && data.generatorHours !== '' && { generatorHours: parseFloat(data.generatorHours) }),
            ...(data.notes && { notes: data.notes.trim() }),
            ...(data.images && data.images.length > 0 && { images: data.images })
        };
    },

    // ============================
    // MAINTENANCE LOG VALIDATORS
    // ============================
    validateMaintenanceLog(data) {
        const errors = [];
        const validTypes = ['routine', 'corrective', 'preventive', 'emergency'];
        const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
        const validPriorities = ['low', 'medium', 'high', 'critical'];

        // Required fields
        if (!data.siteId) {
            errors.push('Site ID is required');
        } else if (!/^[0-9]{6}$/.test(data.siteId)) {
            errors.push('Site ID must be a 6-digit number');
        }

        if (!data.technicianId) {
            errors.push('Technician ID is required');
        }

        if (!data.maintenanceType) {
            errors.push('Maintenance type is required');
        } else if (!validTypes.includes(data.maintenanceType)) {
            errors.push(`Maintenance type must be one of: ${validTypes.join(', ')}`);
        }

        if (!data.title || data.title.trim().length === 0) {
            errors.push('Maintenance title is required');
        } else if (data.title.length > 100) {
            errors.push('Title cannot exceed 100 characters');
        }

        if (!data.description || data.description.trim().length === 0) {
            errors.push('Description is required');
        } else if (data.description.length > 1000) {
            errors.push('Description cannot exceed 1000 characters');
        }

        if (data.laborHours === undefined || data.laborHours === '') {
            errors.push('Labor hours is required');
        } else if (isNaN(data.laborHours) || data.laborHours < 0) {
            errors.push('Labor hours must be a positive number');
        }

        // Optional but validated if provided
        if (data.status && !validStatuses.includes(data.status)) {
            errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
        }

        if (data.priority && !validPriorities.includes(data.priority)) {
            errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
        }

        if (data.totalCost !== undefined && data.totalCost !== '') {
            if (isNaN(data.totalCost) || data.totalCost < 0) {
                errors.push('Total cost must be a positive number');
            }
        }

        if (data.generatorHours !== undefined && data.generatorHours !== '') {
            if (isNaN(data.generatorHours) || data.generatorHours < 0) {
                errors.push('Generator hours must be a positive number');
            }
        }

        if (data.notes && data.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }

        // Validate parts array if provided
        if (data.partsUsed && Array.isArray(data.partsUsed)) {
            data.partsUsed.forEach((part, index) => {
                if (!part.name) {
                    errors.push(`Part ${index + 1}: Name is required`);
                }
                if (!part.quantity || isNaN(part.quantity) || part.quantity < 1) {
                    errors.push(`Part ${index + 1}: Quantity must be at least 1`);
                }
                if (part.cost !== undefined && part.cost !== '' && (isNaN(part.cost) || part.cost < 0)) {
                    errors.push(`Part ${index + 1}: Cost must be a positive number`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            data: errors.length === 0 ? this.sanitizeMaintenanceLog(data) : null
        };
    },

    sanitizeMaintenanceLog(data) {
        return {
            siteId: data.siteId,
            technicianId: data.technicianId,
            maintenanceType: data.maintenanceType,
            title: data.title.trim(),
            description: data.description.trim(),
            laborHours: parseFloat(data.laborHours),
            completedDate: data.completedDate || new Date().toISOString(),
            status: data.status || 'completed',
            priority: data.priority || 'medium',
            ...(data.totalCost !== undefined && data.totalCost !== '' && { totalCost: parseFloat(data.totalCost) }),
            ...(data.generatorHours !== undefined && data.generatorHours !== '' && { generatorHours: parseFloat(data.generatorHours) }),
            ...(data.nextMaintenanceDate && { nextMaintenanceDate: data.nextMaintenanceDate }),
            ...(data.notes && { notes: data.notes.trim() }),
            ...(data.partsUsed && data.partsUsed.length > 0 && { partsUsed: data.partsUsed }),
            ...(data.images && data.images.length > 0 && { images: data.images })
        };
    },

    // ============================
    // SITE VALIDATORS
    // ============================
    validateSite(data) {
        const errors = [];

        // Site ID validation
        if (!data.siteId) {
            errors.push('Site ID is required');
        } else if (!/^[0-9]{6}$/.test(data.siteId)) {
            errors.push('Site ID must be exactly 6 digits');
        }

        // Site name validation
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Site name is required');
        } else if (data.name.length > 100) {
            errors.push('Site name cannot exceed 100 characters');
        }

        // Location validation
        if (!data.location) {
            errors.push('Location is required');
        } else {
            if (!data.location.address || data.location.address.trim().length === 0) {
                errors.push('Address is required');
            }
            if (data.location.coordinates) {
                if (isNaN(data.location.coordinates.latitude) || 
                    data.location.coordinates.latitude < -90 || 
                    data.location.coordinates.latitude > 90) {
                    errors.push('Latitude must be between -90 and 90');
                }
                if (isNaN(data.location.coordinates.longitude) || 
                    data.location.coordinates.longitude < -180 || 
                    data.location.coordinates.longitude > 180) {
                    errors.push('Longitude must be between -180 and 180');
                }
            }
        }

        // AC System validation
        if (!data.acSystem) {
            errors.push('AC system details are required');
        } else {
            if (data.acSystem.capacity === undefined || isNaN(data.acSystem.capacity) || data.acSystem.capacity < 0) {
                errors.push('AC capacity must be a positive number');
            }
            if (!['110V', '220V', '240V'].includes(data.acSystem.voltage)) {
                errors.push('AC voltage must be 110V, 220V, or 240V');
            }
            if (!['Single', 'Three'].includes(data.acSystem.phase)) {
                errors.push('AC phase must be Single or Three');
            }
        }

        // DC System validation
        if (!data.dcSystem) {
            errors.push('DC system details are required');
        } else {
            if (data.dcSystem.batteryCapacity === undefined || isNaN(data.dcSystem.batteryCapacity) || data.dcSystem.batteryCapacity < 0) {
                errors.push('Battery capacity must be a positive number');
            }
            if (data.dcSystem.inverterCapacity === undefined || isNaN(data.dcSystem.inverterCapacity) || data.dcSystem.inverterCapacity < 0) {
                errors.push('Inverter capacity must be a positive number');
            }
            if (data.dcSystem.solarCapacity !== undefined && (isNaN(data.dcSystem.solarCapacity) || data.dcSystem.solarCapacity < 0)) {
                errors.push('Solar capacity must be a positive number');
            }
        }

        // Generator validation
        if (!data.generator) {
            errors.push('Generator details are required');
        } else {
            if (data.generator.capacity === undefined || isNaN(data.generator.capacity) || data.generator.capacity < 0) {
                errors.push('Generator capacity must be a positive number');
            }
            if (data.generator.fuelTankCapacity === undefined || isNaN(data.generator.fuelTankCapacity) || data.generator.fuelTankCapacity < 0) {
                errors.push('Fuel tank capacity must be a positive number');
            }
        }

        // Fuel validation
        if (!data.fuel) {
            errors.push('Fuel information is required');
        } else {
            if (data.fuel.currentLevel === undefined || isNaN(data.fuel.currentLevel) || data.fuel.currentLevel < 0 || data.fuel.currentLevel > 100) {
                errors.push('Current fuel level must be between 0 and 100');
            }
            if (data.fuel.consumptionRate === undefined || isNaN(data.fuel.consumptionRate) || data.fuel.consumptionRate < 0) {
                errors.push('Consumption rate must be a positive number');
            }
        }

        // Maintenance schedule validation
        if (!data.maintenanceSchedule) {
            errors.push('Maintenance schedule is required');
        } else {
            if (!data.maintenanceSchedule.nextMaintenance) {
                errors.push('Next maintenance date is required');
            }
            if (data.maintenanceSchedule.maintenanceInterval === undefined || isNaN(data.maintenanceSchedule.maintenanceInterval) || data.maintenanceSchedule.maintenanceInterval < 0) {
                errors.push('Maintenance interval must be a positive number');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            data: errors.length === 0 ? this.sanitizeSite(data) : null
        };
    },

    sanitizeSite(data) {
        return {
            siteId: data.siteId,
            name: data.name.trim(),
            location: {
                address: data.location.address.trim(),
                ...(data.location.coordinates && {
                    coordinates: {
                        latitude: parseFloat(data.location.coordinates.latitude),
                        longitude: parseFloat(data.location.coordinates.longitude)
                    }
                })
            },
            acSystem: {
                capacity: parseFloat(data.acSystem.capacity),
                voltage: data.acSystem.voltage,
                phase: data.acSystem.phase
            },
            dcSystem: {
                batteryCapacity: parseFloat(data.dcSystem.batteryCapacity),
                inverterCapacity: parseFloat(data.dcSystem.inverterCapacity),
                ...(data.dcSystem.solarCapacity !== undefined && { solarCapacity: parseFloat(data.dcSystem.solarCapacity) })
            },
            generator: {
                capacity: parseFloat(data.generator.capacity),
                fuelTankCapacity: parseFloat(data.generator.fuelTankCapacity),
                currentRunHours: data.generator.currentRunHours ? parseFloat(data.generator.currentRunHours) : 0,
                lastMaintenanceHours: data.generator.lastMaintenanceHours ? parseFloat(data.generator.lastMaintenanceHours) : 0
            },
            fuel: {
                currentLevel: parseFloat(data.fuel.currentLevel),
                consumptionRate: parseFloat(data.fuel.consumptionRate),
                ...(data.fuel.lastRefuelDate && { lastRefuelDate: data.fuel.lastRefuelDate })
            },
            maintenanceSchedule: {
                nextMaintenance: data.maintenanceSchedule.nextMaintenance,
                maintenanceInterval: parseFloat(data.maintenanceSchedule.maintenanceInterval),
                ...(data.maintenanceSchedule.lastMaintenance && { lastMaintenance: data.maintenanceSchedule.lastMaintenance })
            }
        };
    },

    // ============================
    // EMAIL VALIDATOR
    // ============================
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // ============================
    // PASSWORD VALIDATOR
    // ============================
    validatePassword(password) {
        return password && password.length >= 6;
    },

    // ============================
    // PHONE VALIDATOR
    // ============================
    validatePhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    // ============================
    // GENERIC VALIDATORS
    // ============================
    isRequired(value) {
        return value !== undefined && value !== null && value !== '';
    },

    isNumber(value) {
        return !isNaN(value) && value !== '';
    },

    isPositive(value) {
        return this.isNumber(value) && value >= 0;
    },

    isInRange(value, min, max) {
        return this.isNumber(value) && value >= min && value <= max;
    }
};

export default validators;
