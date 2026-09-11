const express = require('express');
const {
  getIncidents,
  acknowledgeIncident,
  resolveIncident,
} = require('../controllers/incidentController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { incidentsQuerySchema, resolveIncidentSchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Incidents
 *   description: Safety incidents raised from worker safety events
 */

/**
 * @openapi
 * /api/incidents:
 *   get:
 *     tags: [Incidents]
 *     summary: List incidents with optional filters
 *     description: |
 *       Returns incidents sorted newest first.
 *       Worker, device, and source event fields are fully populated.
 *       Use the status, severity, type, and workerId query parameters to narrow results.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, ACKNOWLEDGED, RESOLVED]
 *         description: Filter by incident lifecycle status
 *         example: OPEN
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [HIGH, CRITICAL]
 *         description: Filter by incident severity
 *         example: CRITICAL
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HIGH_TEMPERATURE, LOW_BATTERY, FALL_DETECTED, NO_MOVEMENT, GEOFENCE_BREACH, SOS]
 *         description: Filter by incident type (matches the originating event type)
 *         example: FALL_DETECTED
 *       - in: query
 *         name: workerId
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Filter incidents for a specific worker (MongoDB ObjectId)
 *         example: 6650f2a1c2e4b12345abcd01
 *     responses:
 *       200:
 *         description: Incident list retrieved successfully
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
 *                   example: 4
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incident'
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', requireAuth, validateRequest(incidentsQuerySchema), getIncidents);

/**
 * @openapi
 * /api/incidents/{id}/acknowledge:
 *   post:
 *     tags: [Incidents]
 *     summary: Acknowledge an open incident
 *     description: |
 *       Transitions the incident from OPEN to ACKNOWLEDGED and records the timestamp.
 *       A real-time Socket.IO event (`safety:incident`) is emitted to all connected clients.
 *       Returns 400 if the incident is already acknowledged or resolved.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: MongoDB ObjectId of the incident to acknowledge
 *         example: 6650f2a1c2e4b12345abcd03
 *     responses:
 *       200:
 *         description: Incident acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Incident acknowledged
 *                 data:
 *                   $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Incident is already acknowledged or resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               alreadyAcknowledged:
 *                 summary: Already acknowledged
 *                 value:
 *                   success: false
 *                   message: Incident is already acknowledged
 *               alreadyResolved:
 *                 summary: Already resolved
 *                 value:
 *                   success: false
 *                   message: Resolved incidents cannot be acknowledged
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Incident not found
 */
router.post('/:id/acknowledge', requireAuth, validateObjectId(), acknowledgeIncident);

/**
 * @openapi
 * /api/incidents/{id}/resolve:
 *   post:
 *     tags: [Incidents]
 *     summary: Resolve an open or acknowledged incident
 *     description: |
 *       Transitions the incident to RESOLVED, records the timestamp, and optionally
 *       stores a resolution note. A real-time Socket.IO event (`safety:incident`) is
 *       emitted to all connected clients. Returns 400 if already resolved.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: MongoDB ObjectId of the incident to resolve
 *         example: 6650f2a1c2e4b12345abcd03
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolutionNote:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note explaining how the incident was resolved
 *                 example: Issue handled by supervisor – worker evacuated safely
 *     responses:
 *       200:
 *         description: Incident resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Incident resolved
 *                 data:
 *                   $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Incident is already resolved, or resolutionNote exceeds 500 characters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Incident is already resolved
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:id/resolve',
  requireAuth,
  validateObjectId(),
  validateRequest(resolveIncidentSchema),
  resolveIncident
);

module.exports = router;
