const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const verifyToken = require('../middleware/verifyToken');
const { requireRole, ROLES } = require('../middleware/requireRole');

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Maintenance management and scheduling
 */

/**
 * @swagger
 * /maintenance:
 *   post:
 *     summary: Add maintenance log
 *     description: Record a maintenance activity for a site
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaintenanceLog'
 *     responses:
 *       201:
 *         description: Maintenance log added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Site not found
 */
router.post('/', verifyToken, requireRole([ROLES.TECHNICIAN, ROLES.SUPERVISOR, ROLES.ADMIN]), maintenanceController.addMaintenanceLog);

/**
 * @swagger
 * /maintenance/site/{siteId}:
 *   get:
 *     summary: Get maintenance logs for a site
 *     description: Retrieve all maintenance logs for a specific site
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [routine, corrective, preventive, emergency]
 *         description: Filter by maintenance type
 *     responses:
 *       200:
 *         description: Maintenance logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 maintenanceLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaintenanceLog'
 *                 total:
 *                   type: integer
 *                 site:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Site not found
 */
router.get('/site/:siteId', verifyToken, maintenanceController.getSiteMaintenanceLogs);

/**
 * @swagger
 * /maintenance/upcoming:
 *   get:
 *     summary: Get upcoming maintenance
 *     description: Retrieve maintenance activities scheduled for the near future
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Upcoming maintenance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 upcomingMaintenance:
 *                   type: array
 *                 total:
 *                   type: integer
 *                 period:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/upcoming', verifyToken, maintenanceController.getUpcomingMaintenance);

/**
 * @swagger
 * /maintenance/analytics/{siteId}:
 *   get:
 *     summary: Get maintenance analytics
 *     description: Retrieve maintenance analytics and cost trends for a site
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [30d, 60d, 90d, 180d]
 *           default: 90d
 *         description: Analysis period
 *     responses:
 *       200:
 *         description: Maintenance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analytics:
 *                   type: object
 *                 costTrends:
 *                   type: object
 *                 maintenanceSchedule:
 *                   type: object
 *                 siteInfo:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Site not found
 */
router.get('/analytics/:siteId', verifyToken, maintenanceController.getMaintenanceAnalytics);

/**
 * @swagger
 * /maintenance/verify/{logId}:
 *   post:
 *     summary: Verify maintenance log (Supervisor/Admin only)
 *     description: Mark a maintenance log as verified by supervisor or admin
 *     tags: [Maintenance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance log ID
 *     responses:
 *       200:
 *         description: Maintenance log verified successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Maintenance log not found
 */
router.post('/verify/:logId', verifyToken, requireRole([ROLES.SUPERVISOR, ROLES.ADMIN]), maintenanceController.verifyMaintenanceLog);

module.exports = router;