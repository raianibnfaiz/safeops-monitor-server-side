const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Dashboard
 *   description: Operational overview and system health
 */

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get the operational dashboard summary
 *     description: |
 *       Returns a comprehensive snapshot of the entire SafeOps Monitor platform including:
 *       - Total and active worker/device counts
 *       - Incident counts broken down by lifecycle status
 *       - Critical event count
 *       - Visualization data for charts (incidents by severity and by day)
 *       - System health (database status, simulator state, connected Socket.IO clients, uptime)
 *       - 5 most recent incidents
 *       - 5 most recent events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *             example:
 *               success: true
 *               data:
 *                 workersTotal: 12
 *                 activeWorkers: 10
 *                 devicesTotal: 12
 *                 devices:
 *                   online: 11
 *                   offline: 1
 *                 incidents:
 *                   open: 4
 *                   acknowledged: 3
 *                   resolved: 8
 *                 criticalEvents: 7
 *                 visualization:
 *                   incidentsBySeverity:
 *                     - severity: CRITICAL
 *                       count: 5
 *                     - severity: HIGH
 *                       count: 10
 *                   incidentsByDay:
 *                     - day: "2026-09-07"
 *                       count: 3
 *                     - day: "2026-09-08"
 *                       count: 4
 *                 systemHealth:
 *                   database: CONNECTED
 *                   simulator:
 *                     isRunning: true
 *                     lastGeneratedAt: "2026-09-09T07:28:00.000Z"
 *                     nextDelayMs: 17340
 *                   clientsConnected: 2
 *                   uptimeSeconds: 3600
 *                 recentIncidents: []
 *                 recentEvents: []
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', requireAuth, getDashboardSummary);

module.exports = router;
