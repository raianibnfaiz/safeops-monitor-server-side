const express = require('express');
const { getWorkers, getWorkerById } = require('../controllers/workerController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { workersQuerySchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Workers
 *   description: Wearable-device workers monitored by SafeOps
 */

/**
 * @openapi
 * /api/workers:
 *   get:
 *     tags: [Workers]
 *     summary: List all workers
 *     description: |
 *       Returns a summary list of all monitored workers with their current status,
 *       last known location, battery level, and assigned device details.
 *       Supports optional filtering by worker status, device status, and free-text search.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, OFFLINE, ON_BREAK]
 *         description: Filter workers by operational status
 *         example: ACTIVE
 *       - in: query
 *         name: deviceStatus
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *         description: Filter workers by the status of their assigned device
 *         example: ACTIVE
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive text search against worker name or workerId
 *         example: Amina
 *     responses:
 *       200:
 *         description: Worker list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 12
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkerSummary'
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Authentication token is required
 */
router.get('/', requireAuth, validateRequest(workersQuerySchema), getWorkers);

/**
 * @openapi
 * /api/workers/{id}:
 *   get:
 *     tags: [Workers]
 *     summary: Get a single worker with full detail
 *     description: |
 *       Returns the complete worker record including their assigned device,
 *       the 10 most recent safety events, and the 10 most recent incidents.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: MongoDB ObjectId of the worker
 *         example: 6650f2a1c2e4b12345abcd01
 *     responses:
 *       200:
 *         description: Worker record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WorkerDetail'
 *       400:
 *         description: Invalid ObjectId format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid id parameter
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Worker not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Worker not found
 */
router.get('/:id', requireAuth, validateObjectId(), getWorkerById);

module.exports = router;
