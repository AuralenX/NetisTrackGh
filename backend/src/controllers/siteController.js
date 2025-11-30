const { db } = require('../config/firebaseAdmin');
const { validateSite, validateSiteUpdate } = require('../models/siteModel');
const logger = require('../utils/logger');

class SiteController {
  // Create new site with manual siteId
  async createSite(req, res, next) {
    try {
      const { error, value } = validateSite(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      // Check if siteId already exists
      const existingSite = await db.collection('sites').doc(value.siteId).get();
      if (existingSite.exists) {
        return res.status(409).json({
          error: 'Site ID already exists',
          code: 'SITE_ID_EXISTS',
          siteId: value.siteId
        });
      }

      // Add createdBy field and ensure siteId is used as document ID
      value.createdBy = req.user.uid;
      value.assignedTechnician = req.user.role === 'technician' ? req.user.uid : value.assignedTechnician;

      // Use siteId as the Firestore document ID
      await db.collection('sites').doc(value.siteId).set({
        ...value,
        id: value.siteId, // Also store in data for consistency
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Site created successfully', { 
        siteId: value.siteId, 
        userId: req.user.uid 
      });

      res.status(201).json({
        message: 'Site created successfully',
        siteId: value.siteId,
        data: value
      });

    } catch (error) {
      next(error);
    }
  }

  // Get site by siteId (not auto-generated ID)
  async getSite(req, res, next) {
    try {
      const { siteId } = req.params; // Now using siteId instead of id
      const siteDoc = await db.collection('sites').doc(siteId).get();

      if (!siteDoc.exists) {
        return res.status(404).json({
          error: 'Site not found',
          code: 'SITE_NOT_FOUND',
          siteId: siteId
        });
      }

      const site = siteDoc.data();

      // Role-based access control
      if (req.user.role === 'technician' && site.assignedTechnician !== req.user.uid) {
        return res.status(403).json({
          error: 'Access denied to this site',
          code: 'ACCESS_DENIED'
        });
      }

      res.json({ site });

    } catch (error) {
      next(error);
    }
  }

  // Get sites for current user
  async getUserSites(req, res, next) {
    try {
      let query = db.collection('sites').where('isActive', '==', true);

      // Technicians can only see their assigned sites
      if (req.user.role === 'technician') {
        query = query.where('assignedTechnician', '==', req.user.uid);
      }

      const snapshot = await query.get();
      const sites = snapshot.docs.map(doc => doc.data());

      logger.info('Retrieved user sites', {
        userId: req.user.uid,
        role: req.user.role,
        siteCount: sites.length
      });

      res.json({ sites });

    } catch (error) {
      next(error);
    }
  }

  // Update site by siteId
  async updateSite(req, res, next) {
    try {
      const { siteId } = req.params; // Now using siteId instead of id
      const siteDoc = await db.collection('sites').doc(siteId).get();

      if (!siteDoc.exists) {
        return res.status(404).json({
          error: 'Site not found',
          code: 'SITE_NOT_FOUND',
          siteId: siteId
        });
      }

      const site = siteDoc.data();

      // Check permissions
      if (req.user.role === 'technician' && site.assignedTechnician !== req.user.uid) {
        return res.status(403).json({
          error: 'Cannot update this site',
          code: 'UPDATE_DENIED'
        });
      }

      const { error, value } = validateSiteUpdate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      await db.collection('sites').doc(siteId).update({
        ...value,
        updatedAt: new Date()
      });

      logger.info('Site updated successfully', {
        siteId: siteId,
        userId: req.user.uid
      });

      res.json({
        message: 'Site updated successfully',
        siteId: siteId
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete site by siteId
  async deleteSite(req, res, next) {
    try {
      const { siteId } = req.params;

      const siteDoc = await db.collection('sites').doc(siteId).get();
      if (!siteDoc.exists) {
        return res.status(404).json({
          error: 'Site not found',
          code: 'SITE_NOT_FOUND',
          siteId: siteId
        });
      }

      // Soft delete - set isActive to false
      await db.collection('sites').doc(siteId).update({
        isActive: false,
        updatedAt: new Date(),
        deletedBy: req.user.uid,
        deletedAt: new Date()
      });

      logger.info('Site deleted (soft delete)', {
        siteId: siteId,
        userId: req.user.uid
      });

      res.json({
        message: 'Site deleted successfully',
        siteId: siteId
      });

    } catch (error) {
      next(error);
    }
  }

  // Search sites by siteId or name
  async searchSites(req, res, next) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          error: 'Search query must be at least 2 characters long',
          code: 'INVALID_SEARCH_QUERY'
        });
      }

      let sitesQuery = db.collection('sites')
        .where('isActive', '==', true);

      // For technicians, only search their assigned sites
      if (req.user.role === 'technician') {
        sitesQuery = sitesQuery.where('assignedTechnician', '==', req.user.uid);
      }

      const snapshot = await sitesQuery.get();
      
      const sites = snapshot.docs
        .map(doc => doc.data())
        .filter(site => 
          site.siteId.includes(query) || 
          site.name.toLowerCase().includes(query.toLowerCase())
        );

      res.json({
        sites,
        total: sites.length,
        query: query
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SiteController();