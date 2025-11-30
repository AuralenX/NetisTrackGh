const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuelController');
const verifyToken = require('../middleware/verifyToken');
const { requireRole, ROLES } = require('../middleware/requireRole');

/**
 * @swagger
 * tags:
 *   name: Fuel
 *   description: Fuel management and consumption tracking
 */

/**
 * @swagger
 * /fuel:
 *   post:
 *     summary: Add fuel log entry
 *     description: Record a fuel refueling event for a site
 *     tags: [Fuel]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteId
 *               - fuelAmount
 *               - currentLevel
 *             properties:
 *               siteId:
 *                 type: string
 *               fuelAmount:
 *                 type: number
 *                 minimum: 0
 *               fuelCost:
 *                 type: number
 *                 minimum: 0
 *               currentLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               previousLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               refuelDate:
 *                 type: string
 *                 format: date-time
 *               odometerReading:
 *                 type: number
 *               generatorHours:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fuel log added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Site not found
 */
router.post('/', verifyToken, requireRole([ROLES.TECHNICIAN, ROLES.SUPERVISOR, ROLES.ADMIN]), fuelController.addFuelLog);

/**
 * @swagger
 * /fuel/site/{siteId}:
 *   get:
 *     summary: Get fuel logs for a site
 *     description: Retrieve all fuel logs for a specific site
 *     tags: [Fuel]
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
 *     responses:
 *       200:
 *         description: Fuel logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fuelLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FuelLog'
 *                 total:
 *                   type: integer
 *                 site:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     currentFuelLevel:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Site not found
 */
router.get('/site/:siteId', verifyToken, fuelController.getSiteFuelLogs);

/**
 * @swagger
 * /fuel/consumption/{siteId}:
 *   get:
 *     summary: Get fuel consumption analytics
 *     description: Retrieve fuel consumption analytics and calculations for a site
 *     tags: [Fuel]
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
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Analysis period
 *     responses:
 *       200:
 *         description: Consumption analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analytics:
 *                   type: object
 *                 consumptionRate:
 *                   type: number
 *                 remainingRuntime:
 *                   type: number
 *                 anomalies:
 *                   type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Site not found
 */
router.get('/consumption/:siteId', verifyToken, fuelController.getFuelConsumption);

/**
 * @swagger
 * /fuel/verify/{logId}:
 *   post:
 *     summary: Verify fuel log (Supervisor/Admin only)
 *     description: Mark a fuel log as verified by supervisor or admin
 *     tags: [Fuel]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Fuel log ID
 *     responses:
 *       200:
 *         description: Fuel log verified successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Fuel log not found
 */
router.post('/verify/:logId', verifyToken, requireRole([ROLES.SUPERVISOR, ROLES.ADMIN]), fuelController.verifyFuelLog);

module.exports = router;