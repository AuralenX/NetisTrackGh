const { db } = require('../config/firebaseAdmin');
const { validateFuelLog, validateFuelCalculation } = require('../models/fuelModel');
const FuelCalculator = require('../utils/fuelCalculator');
const logger = require('../utils/logger');

class FuelController {
  /**
   * Add fuel log entry
   */
  async addFuelLog(req, res, next) {
    try {
      const { error, value } = validateFuelLog({
        ...req.body,
        technicianId: req.user.uid
      });

      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      // Verify site exists and user has access
      const siteDoc = await db.collection('sites').doc(value.siteId).get();
      if (!siteDoc.exists) {
        return res.status(404).json({
          error: 'Site not found',
          code: 'SITE_NOT_FOUND'
        });
      }

      const site = siteDoc.data();
      if (req.user.role === 'technician' && site.assignedTechnician !== req.user.uid) {
        return res.status(403).json({
          error: 'Access denied to this site',
          code: 'ACCESS_DENIED'
        });
      }

      const fuelLogRef = db.collection('fuelLogs').doc();
      await fuelLogRef.set({
        ...value,
        id: fuelLogRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update site fuel level
      await db.collection('sites').doc(value.siteId).update({
        'fuel.currentLevel': value.currentLevel,
        'fuel.lastRefuelDate': value.refuelDate,
        updatedAt: new Date()
      });

      logger.info('Fuel log added', {
        fuelLogId: fuelLogRef.id,
        siteId: value.siteId,
        technicianId: req.user.uid
      });

      res.status(201).json({
        message: 'Fuel log added successfully',
        fuelLogId: fuelLogRef.id,
        data: { ...value, id: fuelLogRef.id }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fuel logs for a site
   */
  async getSiteFuelLogs(req, res, next) {
    try {
      const { siteId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Verify site access
      const siteDoc = await db.collection('sites').doc(siteId).get();
      if (!siteDoc.exists) {
        return res.status(404).json({
          error: 'Site not found',
          code: 'SITE_NOT_FOUND'
        });
      }

      const site = siteDoc.data();
      if (req.user.role === 'technician' && site.assignedTechnician !== req.user.uid) {
        return res.status(403).json({
          error: 'Access denied to this site',
          code: 'ACCESS_DENIED'
        });
      }

      let query = db.collection('fuelLogs')
        .where('siteId', '==', siteId)
        .orderBy('refuelDate', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      const snapshot = await query.get();
      const fuelLogs = snapshot.docs.map(doc => doc.data());

      res.json({
        fuelLogs,
        total: fuelLogs.length,
        site: {
          id: siteId,
          name: site.name,
          currentFuelLevel: site.fuel?.currentLevel || 0
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fuel consumption analytics
   */
  async getFuelConsumption(req, res, next) {
    try {
      const { siteId } = req.params;
      const { period = '30d' } = req.query;

      // Verify site access
      const siteDoc = await db.collection('sites').doc(siteId).get();
      if (!siteDoc.exists) {
        return res.status(404).json({
          error: 'Site not found',
          code: 'SITE_NOT_FOUND'
        });
      }

      const site = siteDoc.data();
      if (req.user.role === 'technician' && site.assignedTechnician !== req.user.uid) {
        return res.status(403).json({
          error: 'Access denied to this site',
          code: 'ACCESS_DENIED'
        });
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const fuelLogsSnapshot = await db.collection('fuelLogs')
        .where('siteId', '==', siteId)
        .where('refuelDate', '>=', startDate)
        .where('refuelDate', '<=', endDate)
        .orderBy('refuelDate', 'asc')
        .get();

      const fuelLogs = fuelLogsSnapshot.docs.map(doc => doc.data());

      // Calculate analytics
      const totalFuel = fuelLogs.reduce((sum, log) => sum + log.fuelAmount, 0);
      const consumptionRate = FuelCalculator.calculateConsumptionRate(fuelLogs);
      const remainingRuntime = FuelCalculator.calculateRemainingRuntime(
        site.fuel?.currentLevel || 0,
        consumptionRate,
        site.generator?.fuelTankCapacity || 0
      );

      const anomalies = FuelCalculator.detectFuelTheft(fuelLogs);

      res.json({
        analytics: {
          period,
          totalFuel,
          averageConsumption: consumptionRate,
          remainingRuntime,
          fuelLogsCount: fuelLogs.length,
          anomalies: anomalies.length
        },
        consumptionRate,
        remainingRuntime: Math.round(remainingRuntime),
        anomalies
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify fuel log (Supervisor/Admin only)
   */
  async verifyFuelLog(req, res, next) {
    try {
      const { logId } = req.params;

      const fuelLogDoc = await db.collection('fuelLogs').doc(logId).get();
      if (!fuelLogDoc.exists) {
        return res.status(404).json({
          error: 'Fuel log not found',
          code: 'FUEL_LOG_NOT_FOUND'
        });
      }

      await db.collection('fuelLogs').doc(logId).update({
        isVerified: true,
        verifiedBy: req.user.uid,
        verifiedAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Fuel log verified', {
        fuelLogId: logId,
        verifiedBy: req.user.uid
      });

      res.json({
        message: 'Fuel log verified successfully',
        logId
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FuelController();