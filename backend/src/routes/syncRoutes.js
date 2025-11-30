const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const verifyToken = require('../middleware/verifyToken');
const { requireRole, ROLES } = require('../middleware/requireRole');

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: Offline data synchronization
 */

/**
 * @swagger
 * /sync:
 *   post:
 *     summary: Process offline sync queue
 *     description: Upload and process queued offline operations from mobile/desktop clients
 *     tags: [Sync]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operations
 *               - lastSyncTimestamp
 *               - deviceId
 *             properties:
 *               operations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [create, update, delete]
 *                     collection:
 *                       type: string
 *                     documentId:
 *                       type: string
 *                     data:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     offlineId:
 *                       type: string
 *               lastSyncTimestamp:
 *                 type: string
 *                 format: date-time
 *               deviceId:
 *                 type: string
 *               appVersion:
 *                 type: string
 *               deviceInfo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 results:
 *                   type: object
 *                 summary:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', verifyToken, syncController.processSyncQueue);

/**
 * @swagger
 * /sync/status:
 *   get:
 *     summary: Get sync status
 *     description: Retrieve synchronization status and information for the current user
 *     tags: [Sync]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 syncStatus:
 *                   type: object
 *                 serverTime:
 *                   type: string
 *                 supportedCollections:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/status', verifyToken, syncController.getSyncStatus);

/**
 * @swagger
 * /sync/conflicts:
 *   post:
 *     summary: Resolve sync conflicts
 *     description: Manually resolve synchronization conflicts
 *     tags: [Sync]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conflicts
 *             properties:
 *               conflicts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     operationId:
 *                       type: string
 *                     resolution:
 *                       type: string
 *                       enum: [local, server, manual]
 *                     resolvedData:
 *                       type: object
 *     responses:
 *       200:
 *         description: Conflicts resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *       400:
 *         description: Invalid conflicts data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/conflicts', verifyToken, syncController.resolveConflicts);

module.exports = router;