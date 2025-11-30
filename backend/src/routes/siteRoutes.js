const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const verifyToken = require('../middleware/verifyToken');
const { requireRole, ROLES } = require('../middleware/requireRole');

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /sites:
 *   get:
 *     summary: Get all sites for current user
 *     description: Retrieve sites based on user role (technicians see only their sites, supervisors/admins see all)
 *     tags: [Sites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search sites by siteId or name
 *     responses:
 *       200:
 *         description: List of sites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Site'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', siteController.getUserSites);

/**
 * @swagger
 * /sites/search:
 *   get:
 *     summary: Search sites by siteId or name
 *     description: Search for sites using site ID or site name
 *     tags: [Sites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (site ID or site name)
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Site'
 *                 total:
 *                   type: integer
 *                 query:
 *                   type: string
 *       400:
 *         description: Invalid search query
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/search', siteController.searchSites);

/**
 * @swagger
 * /sites/{siteId}:
 *   get:
 *     summary: Get site by siteId
 *     description: Retrieve detailed information about a specific site using its unique site ID
 *     tags: [Sites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *         description: 6-digit Site ID (e.g., 600545)
 *     responses:
 *       200:
 *         description: Site details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 site:
 *                   $ref: '#/components/schemas/Site'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:siteId', siteController.getSite);

/**
 * @swagger
 * /sites:
 *   post:
 *     summary: Create a new site with manual siteId
 *     description: Create a new site using pre-assigned telecom site ID (Technician, Supervisor, Admin only)
 *     tags: [Sites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Site'
 *     responses:
 *       201:
 *         description: Site created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 siteId:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Site'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Site ID already exists
 */
router.post('/', requireRole([ROLES.TECHNICIAN, ROLES.SUPERVISOR, ROLES.ADMIN]), siteController.createSite);

/**
 * @swagger
 * /sites/{siteId}:
 *   put:
 *     summary: Update a site by siteId
 *     description: Update site information using site ID (Technician can update own sites, Supervisor/Admin can update any)
 *     tags: [Sites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *         description: 6-digit Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Site'
 *     responses:
 *       200:
 *         description: Site updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:siteId', requireRole([ROLES.TECHNICIAN, ROLES.SUPERVISOR, ROLES.ADMIN]), siteController.updateSite);

/**
 * @swagger
 * /sites/{siteId}:
 *   delete:
 *     summary: Delete a site by siteId (Admin only)
 *     description: Soft delete a site using site ID (sets isActive to false)
 *     tags: [Sites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *         description: 6-digit Site ID
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:siteId', requireRole([ROLES.ADMIN]), siteController.deleteSite);

module.exports = router;