const { db } = require('../config/firebaseAdmin');
const { validateMaintenanceLog, validateMaintenanceSchedule } = require('../models/maintenanceModel');
const MaintenanceScheduler = require('../utils/maintenanceScheduler');
const logger = require('../utils/logger');

class MaintenanceController {
  /**
   * Add maintenance log
   */
  async addMaintenanceLog(req, res, next) {
    try {
      const { error, value } = validateMaintenanceLog({
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

      const maintenanceRef = db.collection('maintenanceLogs').doc();
      await maintenanceRef.set({
        ...value,
        id: maintenanceRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update site maintenance information if it's a generator maintenance
      if (value.maintenanceType === 'preventive' || value.maintenanceType === 'routine') {
        await db.collection('sites').doc(value.siteId).update({
          'generator.lastMaintenanceHours': value.generatorHours || site.generator.currentRunHours,
          'maintenanceSchedule.lastMaintenance': value.completedDate,
          'maintenanceSchedule.nextMaintenance': value.nextMaintenanceDate,
          updatedAt: new Date()
        });
      }

      logger.info('Maintenance log added', {
        maintenanceId: maintenanceRef.id,
        siteId: value.siteId,
        technicianId: req.user.uid,
        maintenanceType: value.maintenanceType
      });

      res.status(201).json({
        message: 'Maintenance log added successfully',
        maintenanceId: maintenanceRef.id,
        data: { ...value, id: maintenanceRef.id }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get maintenance logs for a site
   */
  async getSiteMaintenanceLogs(req, res, next) {
    try {
      const { siteId } = req.params;
      const { limit = 50, offset = 0, type } = req.query;

      // Verify site access
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

      let query = db.collection('maintenanceLogs')
        .where('siteId', '==', siteId);

      if (type) {
        query = query.where('maintenanceType', '==', type);
      }

      query = query.orderBy('completedDate', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      const snapshot = await query.get();
      const maintenanceLogs = snapshot.docs.map(doc => doc.data());

      res.json({
        maintenanceLogs,
        total: maintenanceLogs.length,
        site: {
          id: siteId,
          name: site.name,
          currentRunHours: site.generator?.currentRunHours || 0
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming maintenance
   */
  async getUpcomingMaintenance(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + parseInt(days));

      let query = db.collection('maintenanceLogs')
        .where('nextMaintenanceDate', '>=', currentDate)
        .where('nextMaintenanceDate', '<=', futureDate)
        .where('status', '==', 'completed')
        .orderBy('nextMaintenanceDate', 'asc');

      // For technicians, only show their assigned sites
      if (req.user.role === 'technician') {
        const sitesSnapshot = await db.collection('sites')
          .where('assignedTechnician', '==', req.user.uid)
          .get();
        
        const siteIds = sitesSnapshot.docs.map(doc => doc.id);
        query = query.where('siteId', 'in', siteIds);
      }

      const snapshot = await query.get();
      const upcomingMaintenance = snapshot.docs.map(doc => {
        const log = doc.data();
        return {
          ...log,
          daysUntil: Math.ceil((new Date(log.nextMaintenanceDate) - currentDate) / (1000 * 60 * 60 * 24))
        };
      });

      res.json({
        upcomingMaintenance,
        total: upcomingMaintenance.length,
        period: `${days} days`
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get maintenance analytics
   */
  async getMaintenanceAnalytics(req, res, next) {
    try {
      const { siteId } = req.params;
      const { period = '90d' } = req.query;

      // Verify site access
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

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const maintenanceSnapshot = await db.collection('maintenanceLogs')
        .where('siteId', '==', siteId)
        .where('completedDate', '>=', startDate)
        .where('completedDate', '<=', endDate)
        .get();

      const maintenanceLogs = maintenanceSnapshot.docs.map(doc => doc.data());

      // Calculate analytics
      const totalCost = maintenanceLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
      const totalLaborHours = maintenanceLogs.reduce((sum, log) => sum + (log.laborHours || 0), 0);
      
      const typeCount = maintenanceLogs.reduce((acc, log) => {
        acc[log.maintenanceType] = (acc[log.maintenanceType] || 0) + 1;
        return acc;
      }, {});

      const costTrends = MaintenanceScheduler.calculateMaintenanceCostTrends(maintenanceLogs);

      // Calculate maintenance schedule info
      const maintenanceSchedule = MaintenanceScheduler.calculateNextMaintenance(
        site.generator?.currentRunHours || 0,
        site.generator?.lastMaintenanceHours || 0,
        site.maintenanceSchedule?.maintenanceInterval || 500
      );

      res.json({
        analytics: {
          period,
          totalMaintenance: maintenanceLogs.length,
          totalCost,
          totalLaborHours,
          averageCostPerMaintenance: totalCost / maintenanceLogs.length || 0,
          typeDistribution: typeCount
        },
        costTrends,
        maintenanceSchedule,
        siteInfo: {
          currentRunHours: site.generator?.currentRunHours || 0,
          lastMaintenanceHours: site.generator?.lastMaintenanceHours || 0,
          maintenanceInterval: site.maintenanceSchedule?.maintenanceInterval || 500
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify maintenance log (Supervisor/Admin only)
   */
  async verifyMaintenanceLog(req, res, next) {
    try {
      const { logId } = req.params;

      const maintenanceDoc = await db.collection('maintenanceLogs').doc(logId).get();
      if (!maintenanceDoc.exists) {
        return res.status(404).json({
          error: 'Maintenance log not found',
          code: 'MAINTENANCE_LOG_NOT_FOUND'
        });
      }

      await db.collection('maintenanceLogs').doc(logId).update({
        isVerified: true,
        verifiedBy: req.user.uid,
        verifiedAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Maintenance log verified', {
        maintenanceId: logId,
        verifiedBy: req.user.uid
      });

      res.json({
        message: 'Maintenance log verified successfully',
        logId
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MaintenanceController();