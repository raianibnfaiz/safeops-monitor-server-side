const express = require('express');
const { getDevices, getDeviceById } = require('../controllers/deviceController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { devicesQuerySchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Devices
 *   description: Wearable safety devices assigned to workers
 */

/**
 * @openapi
 * /api/devices:
 *   get:
 *     tags: [Devices]
 *     summary: List all devices
 *     description: |
 *       Returns all wearable devices with their current battery level, temperature,
 *       geofence status, and the worker they are assigned to.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *         description: Filter by device operational status
 *         example: ACTIVE
 *       - in: query
 *         name: geofenceStatus
 *         schema:
 *           type: string
 *           enum: [INSIDE, OUTSIDE]
 *         description: Filter by geofence position
 *         example: INSIDE
 *       - in: query
 *         name: workerId
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Filter devices assigned to a specific worker (MongoDB ObjectId)
 *         example: 6650f2a1c2e4b12345abcd01
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search against deviceId
 *         example: SAFEOPS-100
 *     responses:
 *       200:
 *         description: Device list retrieved successfully
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
 *                     $ref: '#/components/schemas/Device'
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', requireAuth, validateRequest(devicesQuerySchema), getDevices);

/**
 * @openapi
 * /api/devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Get a single device by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: MongoDB ObjectId of the device
 *         example: 6650f2a1c2e4b12345abcd02
 *     responses:
 *       200:
 *         description: Device retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       400:
 *         description: Invalid ObjectId format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Device not found
 */
router.get('/:id', requireAuth, validateObjectId(), getDeviceById);

module.exports = router;
