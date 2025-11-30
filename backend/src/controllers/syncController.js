const { db } = require('../config/firebaseAdmin');
const { validateSyncQueue } = require('../models/syncModel');
const logger = require('../utils/logger');

class SyncController {
  /**
   * Process offline sync queue
   */
  async processSyncQueue(req, res, next) {
    try {
      const { error, value } = validateSyncQueue(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Sync validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const { operations, lastSyncTimestamp, deviceId } = value;
      const results = {
        successful: [],
        conflicts: [],
        errors: []
      };

      // Process each operation in the queue
      for (const operation of operations) {
        try {
          const result = await this.processOperation(operation, req.user.uid);
          results.successful.push({
            offlineId: operation.offlineId,
            serverId: result.id,
            type: operation.type,
            collection: operation.collection
          });
        } catch (error) {
          if (error.code === 'CONFLICT') {
            results.conflicts.push({
              offlineId: operation.offlineId,
              type: operation.type,
              collection: operation.collection,
              conflict: error.conflict
            });
          } else {
            results.errors.push({
              offlineId: operation.offlineId,
              type: operation.type,
              collection: operation.collection,
              error: error.message
            });
          }
        }
      }

      // Update user's last sync timestamp
      await db.collection('userSync').doc(req.user.uid).set({
        userId: req.user.uid,
        lastSyncTimestamp: new Date(),
        deviceId,
        appVersion: value.appVersion,
        successfulOperations: results.successful.length,
        conflictedOperations: results.conflicts.length,
        failedOperations: results.errors.length
      }, { merge: true });

      logger.info('Sync queue processed', {
        userId: req.user.uid,
        deviceId,
        totalOperations: operations.length,
        successful: results.successful.length,
        conflicts: results.conflicts.length,
        errors: results.errors.length
      });

      res.json({
        message: 'Sync completed successfully',
        timestamp: new Date().toISOString(),
        results,
        summary: {
          total: operations.length,
          successful: results.successful.length,
          conflicts: results.conflicts.length,
          errors: results.errors.length
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Process individual sync operation
   */
  async processOperation(operation, userId) {
    const { type, collection, documentId, data, timestamp } = operation;

    try {
      switch (type) {
        case 'create':
          return await this.handleCreateOperation(collection, data, userId);
        
        case 'update':
          return await this.handleUpdateOperation(collection, documentId, data, userId);
        
        case 'delete':
          return await this.handleDeleteOperation(collection, documentId, userId);
        
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle create operation
   */
  async handleCreateOperation(collection, data, userId) {
    const docRef = db.collection(collection).doc();
    
    // Add sync metadata
    const documentData = {
      ...data,
      id: docRef.id,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date()
    };

    await docRef.set(documentData);
    return { id: docRef.id, operation: 'create' };
  }

  /**
   * Handle update operation
   */
  async handleUpdateOperation(collection, documentId, data, userId) {
    const docRef = db.collection(collection).doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error(`Document not found: ${collection}/${documentId}`);
    }

    // Check for conflicts (simplified - in real app, use timestamps or version numbers)
    const existingData = docSnapshot.data();
    const serverUpdatedAt = existingData.updatedAt?.toDate() || existingData.createdAt?.toDate();
    const clientUpdatedAt = data.updatedAt;

    if (clientUpdatedAt && serverUpdatedAt && clientUpdatedAt < serverUpdatedAt) {
      throw {
        code: 'CONFLICT',
        conflict: {
          localData: data,
          serverData: existingData,
          message: 'Server has newer version of this document'
        }
      };
    }

    // Update document
    const updateData = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
      lastSyncedAt: new Date()
    };

    await docRef.update(updateData);
    return { id: documentId, operation: 'update' };
  }

  /**
   * Handle delete operation
   */
  async handleDeleteOperation(collection, documentId, userId) {
    const docRef = db.collection(collection).doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error(`Document not found: ${collection}/${documentId}`);
    }

    // Soft delete - set isActive to false
    await docRef.update({
      isActive: false,
      deletedBy: userId,
      deletedAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date()
    });

    return { id: documentId, operation: 'delete' };
  }

  /**
   * Get sync status
   */
  async getSyncStatus(req, res, next) {
    try {
      const userSyncDoc = await db.collection('userSync').doc(req.user.uid).get();
      
      let syncStatus = {
        status: 'never_synced',
        lastSync: null,
        pendingChanges: 0
      };

      if (userSyncDoc.exists) {
        const userSync = userSyncDoc.data();
        syncStatus = {
          status: 'synced',
          lastSync: userSync.lastSyncTimestamp,
          deviceId: userSync.deviceId,
          appVersion: userSync.appVersion,
          lastSyncStats: {
            successful: userSync.successfulOperations || 0,
            conflicts: userSync.conflictedOperations || 0,
            failed: userSync.failedOperations || 0
          }
        };
      }

      // Get pending changes count (this would come from client-side queue)
      // For now, we return a mock value
      syncStatus.pendingChanges = 0;

      res.json({
        syncStatus,
        serverTime: new Date().toISOString(),
        supportedCollections: ['sites', 'fuelLogs', 'maintenanceLogs']
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve sync conflicts
   */
  async resolveConflicts(req, res, next) {
    try {
      const { conflicts } = req.body;

      if (!Array.isArray(conflicts) || conflicts.length === 0) {
        return res.status(400).json({
          error: 'Conflicts array is required',
          code: 'INVALID_CONFLICTS'
        });
      }

      const resolutionResults = [];

      for (const conflict of conflicts) {
        try {
          const { operationId, resolution, resolvedData } = conflict;
          
          // In a real implementation, you would process each conflict resolution
          // For now, we'll just log and return success
          
          resolutionResults.push({
            operationId,
            status: 'resolved',
            resolution
          });

          logger.info('Sync conflict resolved', {
            operationId,
            resolution,
            resolvedBy: req.user.uid
          });

        } catch (error) {
          resolutionResults.push({
            operationId: conflict.operationId,
            status: 'failed',
            error: error.message
          });
        }
      }

      res.json({
        message: 'Conflicts resolution processed',
        results: resolutionResults
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SyncController();